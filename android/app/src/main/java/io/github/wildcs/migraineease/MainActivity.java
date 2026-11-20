package io.github.wildcs.migraineease;

import android.annotation.SuppressLint;
import android.content.Intent;
import android.content.pm.ApplicationInfo;
import android.graphics.Color;
import android.net.Uri;
import android.os.Bundle;
import android.view.ViewGroup;
import android.view.Window;
import android.webkit.JavascriptInterface;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.FrameLayout;

import androidx.activity.ComponentActivity;
import androidx.activity.OnBackPressedCallback;
import androidx.activity.result.ActivityResultLauncher;
import androidx.activity.result.contract.ActivityResultContracts;
import androidx.core.graphics.Insets;
import androidx.core.view.ViewCompat;
import androidx.core.view.WindowCompat;
import androidx.core.view.WindowInsetsCompat;
import androidx.core.view.WindowInsetsControllerCompat;
import androidx.webkit.WebViewAssetLoader;

import org.json.JSONObject;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.nio.charset.StandardCharsets;

/**
 * MigraineEase for Android: a full-screen WebView running the same app as the web version.
 * The web files are bundled in the APK and served from a private https origin, so the app
 * works offline and its data (localStorage) stays on the device.
 */
public class MainActivity extends ComponentActivity {
    private static final String HOST = "appassets.androidplatform.net";
    private static final String START_URL = "https://" + HOST + "/assets/index.html";
    private static final int BG = 0xFF1A1417;
    private static final int MAX_BACKUP_BYTES = 20 * 1024 * 1024;

    private WebView web;
    private WebViewAssetLoader assets;
    private String pendingSave;

    private final ActivityResultLauncher<String> saveJson =
            registerForActivityResult(new ActivityResultContracts.CreateDocument("application/json"), this::onSaveTarget);
    private final ActivityResultLauncher<String> saveCsv =
            registerForActivityResult(new ActivityResultContracts.CreateDocument("text/csv"), this::onSaveTarget);
    private final ActivityResultLauncher<String[]> openDoc =
            registerForActivityResult(new ActivityResultContracts.OpenDocument(), this::onOpenTarget);

    @SuppressLint("SetJavaScriptEnabled")
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // Draw edge to edge with light icons on the dark background.
        Window window = getWindow();
        WindowCompat.setDecorFitsSystemWindows(window, false);
        window.setStatusBarColor(Color.TRANSPARENT);
        window.setNavigationBarColor(BG);
        WindowInsetsControllerCompat bars = WindowCompat.getInsetsController(window, window.getDecorView());
        bars.setAppearanceLightStatusBars(false);
        bars.setAppearanceLightNavigationBars(false);

        FrameLayout root = new FrameLayout(this);
        root.setBackgroundColor(BG);
        web = new WebView(this);
        web.setBackgroundColor(BG);
        root.addView(web, new FrameLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT));
        setContentView(root);

        // Keep the page clear of the status bar, navigation bar, camera cutout and keyboard.
        ViewCompat.setOnApplyWindowInsetsListener(root, (v, insets) -> {
            Insets sys = insets.getInsets(WindowInsetsCompat.Type.systemBars() | WindowInsetsCompat.Type.displayCutout());
            Insets ime = insets.getInsets(WindowInsetsCompat.Type.ime());
            v.setPadding(sys.left, sys.top, sys.right, Math.max(sys.bottom, ime.bottom));
            return WindowInsetsCompat.CONSUMED;
        });

        assets = new WebViewAssetLoader.Builder()
                .setDomain(HOST)
                .addPathHandler("/assets/", new WebViewAssetLoader.AssetsPathHandler(this))
                .build();

        WebSettings s = web.getSettings();
        s.setJavaScriptEnabled(true);
        s.setDomStorageEnabled(true);
        s.setAllowFileAccess(false);
        s.setAllowContentAccess(false);
        s.setSupportZoom(false);
        s.setBuiltInZoomControls(false);

        web.setWebViewClient(new WebViewClient() {
            @Override
            public WebResourceResponse shouldInterceptRequest(WebView view, WebResourceRequest request) {
                return assets.shouldInterceptRequest(request.getUrl());
            }

            @Override
            public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                Uri url = request.getUrl();
                if (HOST.equals(url.getHost())) return false;
                try {
                    startActivity(new Intent(Intent.ACTION_VIEW, url));
                } catch (Exception ignored) {
                    // No app can open this link.
                }
                return true;
            }
        });
        web.addJavascriptInterface(new Bridge(), "AndroidBridge");
        if ((getApplicationInfo().flags & ApplicationInfo.FLAG_DEBUGGABLE) != 0) {
            WebView.setWebContentsDebuggingEnabled(true);
        }

        // Back closes the topmost sheet/dialog in the app first; only then leaves the app.
        getOnBackPressedDispatcher().addCallback(this, new OnBackPressedCallback(true) {
            @Override
            public void handleOnBackPressed() {
                web.evaluateJavascript("(window.handleBack && window.handleBack()) ? 1 : 0", handled -> {
                    if (!"1".equals(handled)) {
                        setEnabled(false);
                        getOnBackPressedDispatcher().onBackPressed();
                        setEnabled(true);
                    }
                });
            }
        });

        web.loadUrl(START_URL);
    }

    @Override
    protected void onDestroy() {
        if (web != null) web.destroy();
        super.onDestroy();
    }

    private void callJs(String fn, String arg) {
        if (web == null) return;
        web.evaluateJavascript("window." + fn + " && window." + fn + "(" + arg + ")", null);
    }

    private void onSaveTarget(Uri uri) {
        String content = pendingSave;
        pendingSave = null;
        if (uri == null) { callJs("__nativeSaved", "false"); return; }
        if (content == null) { callJs("__nativeSaved", "null"); return; }
        try (OutputStream out = getContentResolver().openOutputStream(uri, "w")) {
            if (out == null) throw new IOException("No output stream");
            out.write(content.getBytes(StandardCharsets.UTF_8));
            callJs("__nativeSaved", "true");
        } catch (Exception e) {
            callJs("__nativeSaved", "null");
        }
    }

    private void onOpenTarget(Uri uri) {
        if (uri == null) { callJs("__nativeOpened", "null"); return; }
        try (InputStream in = getContentResolver().openInputStream(uri)) {
            if (in == null) throw new IOException("No input stream");
            ByteArrayOutputStream buf = new ByteArrayOutputStream();
            byte[] chunk = new byte[8192];
            int n;
            while ((n = in.read(chunk)) > 0) {
                buf.write(chunk, 0, n);
                if (buf.size() > MAX_BACKUP_BYTES) throw new IOException("File too large");
            }
            String text = new String(buf.toByteArray(), StandardCharsets.UTF_8);
            callJs("__nativeOpened", JSONObject.quote(text));
        } catch (Exception e) {
            callJs("__nativeOpened", "''"); // the app then reports "not a MigraineEase backup"
        }
    }

    /** Called from JavaScript as window.AndroidBridge.*; runs on a background thread. */
    private class Bridge {
        @JavascriptInterface
        public void saveFile(String name, String mime, String content) {
            runOnUiThread(() -> {
                pendingSave = content;
                try {
                    if (mime != null && mime.startsWith("text/csv")) saveCsv.launch(name);
                    else saveJson.launch(name);
                } catch (Exception e) {
                    pendingSave = null;
                    callJs("__nativeSaved", "null");
                }
            });
        }

        @JavascriptInterface
        public void openFile() {
            runOnUiThread(() -> {
                try {
                    openDoc.launch(new String[]{"*/*"});
                } catch (Exception e) {
                    callJs("__nativeOpened", "null");
                }
            });
        }
    }
}
