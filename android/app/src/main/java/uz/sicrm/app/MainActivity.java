package uz.sicrm.app;

import android.content.Intent;
import android.net.Uri;
import android.os.Bundle;
import android.print.PrintAttributes;
import android.print.PrintManager;
import android.util.Base64;
import android.webkit.JavascriptInterface;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.Toast;
import androidx.core.content.FileProvider;
import com.getcapacitor.BridgeActivity;
import java.io.File;
import java.io.FileOutputStream;

// Web ilova (window.SicrmNative) uchun ko'prik: WebView'da window.print() va <a download> ishlamaydi.
// Faqat *.sicrm.uz sahifalari chaqira oladi (src/utils/nativeBridge.js).
public class MainActivity extends BridgeActivity {
    private WebView printView;

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        getBridge().getWebView().addJavascriptInterface(new SicrmNative(), "SicrmNative");
    }

    private static boolean trusted(String url) {
        if (url == null) return false;
        Uri u = Uri.parse(url);
        String host = u.getHost();
        return "https".equals(u.getScheme()) && host != null && (host.equals("sicrm.uz") || host.endsWith(".sicrm.uz"));
    }

    private class SicrmNative {
        // HTML hujjat → Android chop etish oynasi (printer yoki PDF)
        @JavascriptInterface
        public void printHtml(final String html, final String title) {
            runOnUiThread(() -> {
                WebView main = getBridge().getWebView();
                String page = main.getUrl();
                if (!trusted(page) || html == null) return;
                final String jobName = (title == null || title.isEmpty()) ? "SICRM" : title;
                WebView pv = new WebView(MainActivity.this);
                printView = pv;
                pv.setWebViewClient(new WebViewClient() {
                    private boolean done = false;

                    @Override
                    public void onPageFinished(WebView view, String url) {
                        if (done) return;
                        done = true;
                        PrintManager pm = (PrintManager) getSystemService(PRINT_SERVICE);
                        pm.print(jobName, view.createPrintDocumentAdapter(jobName), new PrintAttributes.Builder().build());
                    }
                });
                Uri base = Uri.parse(page);
                pv.loadDataWithBaseURL(base.getScheme() + "://" + base.getHost() + "/", html, "text/html", "UTF-8", null);
            });
        }

        // Fayl → "Ulashish" oynasi (Fayllarga saqlash, Telegram va h.k.)
        @JavascriptInterface
        public void saveFile(final String base64, final String filename, final String mime) {
            runOnUiThread(() -> {
                if (!trusted(getBridge().getWebView().getUrl()) || base64 == null) return;
                try {
                    String name = (filename == null ? "fayl" : filename).replaceAll("[\\\\/:*?\"<>|]", "_");
                    if (name.isEmpty() || name.length() > 120) name = "fayl";
                    File dir = new File(getCacheDir(), "shared");
                    if (!dir.exists() && !dir.mkdirs()) throw new Exception("papka");
                    File[] old = dir.listFiles();
                    if (old != null) for (File f : old) f.delete();
                    File out = new File(dir, name);
                    try (FileOutputStream fos = new FileOutputStream(out)) {
                        fos.write(Base64.decode(base64, Base64.DEFAULT));
                    }
                    Uri uri = FileProvider.getUriForFile(MainActivity.this, getPackageName() + ".fileprovider", out);
                    Intent send = new Intent(Intent.ACTION_SEND);
                    send.setType(mime == null || mime.isEmpty() ? "application/octet-stream" : mime);
                    send.putExtra(Intent.EXTRA_STREAM, uri);
                    send.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
                    startActivity(Intent.createChooser(send, name));
                } catch (Exception e) {
                    Toast.makeText(MainActivity.this, "Faylni saqlab bo'lmadi", Toast.LENGTH_SHORT).show();
                }
            });
        }
    }
}
