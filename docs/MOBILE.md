# Mobil: Capacitor ile iOS ve Android

Uygulama, aynı web kodunun [Capacitor](https://capacitorjs.com) ile paketlenmesine göre tasarlandı.
Tarayıcıya özel tüm API'ler `src/platform/` altında olduğu için yalnızca o katman değişir.

## 1. Kurulum

```bash
npm install @capacitor/core @capacitor/preferences @capacitor/haptics
```

```bash
npm install -D @capacitor/cli
```

```bash
npx cap init "Math Games" com.example.mathgames --web-dir dist
```

```bash
npm install @capacitor/ios @capacitor/android
```

```bash
npx cap add ios
```

```bash
npx cap add android
```

Her web değişikliğinden sonra:

```bash
npm run build && npx cap sync
```

```bash
npx cap open ios
```

> Hash router kullanıldığı için `capacitor://` / `file://` altında ek yönlendirme ayarı gerekmez.

## 2. StorageAdapter → Capacitor Preferences

`src/platform/storage.ts` içine:

```ts
import { Preferences } from '@capacitor/preferences';

export class CapacitorStorageAdapter implements StorageAdapter {
  async get<T>(key: string): Promise<T | null> {
    try {
      const { value } = await Preferences.get({ key: `mg:${key}` });
      return value === null ? null : (JSON.parse(value) as T);
    } catch {
      return null;
    }
  }
  async set<T>(key: string, value: T): Promise<void> {
    await Preferences.set({ key: `mg:${key}`, value: JSON.stringify(value) });
  }
  async remove(key: string): Promise<void> {
    await Preferences.remove({ key: `mg:${key}` });
  }
}
```

`src/platform/index.ts`'de seçin:

```ts
import { Capacitor } from '@capacitor/core';
export const storage: StorageAdapter = Capacitor.isNativePlatform() ? new CapacitorStorageAdapter() : createDefaultStorage();
```

Arayüz zaten asenkron olduğundan başka bir yer değişmez. Web'deki mevcut ilerlemeyi taşımak isterseniz, ilk
açılışta `LocalStorageAdapter`'dan okuyup Preferences'a yazan tek seferlik bir göç ekleyin.

## 3. Haptik → @capacitor/haptics

`src/platform/haptics.ts` içinde `navigator.vibrate` yerine:

```ts
import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';

play(kind) {
  if (kind === 'tap') void Haptics.impact({ style: ImpactStyle.Light });
  else if (kind === 'success') void Haptics.impact({ style: ImpactStyle.Medium });
  else if (kind === 'error') void Haptics.notification({ type: NotificationType.Warning });
  else void Haptics.notification({ type: NotificationType.Success });
}
```

(iOS Safari `navigator.vibrate` desteklemez; native'de bu sayede iOS'ta da titreşim olur.)

## 4. Ses

- Sesler Web Audio ile sentezlenir, dosya yoktur; WebView'da aynen çalışır.
- **iOS ses kilidi:** iOS, `AudioContext`'i kullanıcı etkileşimi olmadan başlatmaz. `installAudioUnlock()`
  (`src/platform/audio.ts`) ilk `pointerdown`/`keydown`'da context'i oluşturup `resume()` eder ve sessiz bir
  buffer çalar. Ayrıca her `play()` çağrısında `suspended` ise yeniden `resume()` edilir (uygulama arka plandan
  döndüğünde gerekebilir).
- iOS'ta cihaz sessiz moddayken Web Audio çalmaz; bu beklenen davranıştır.
- Arka plana geçişte sesleri durdurmak için `@capacitor/app` `appStateChange` dinlenebilir.

## 5. İkon ve açılış ekranı

```bash
npm install -D @capacitor/assets
```

`assets/icon.png` (1024×1024, `public/icon.svg`'den üretilebilir) ve `assets/splash.png` (2732×2732, krem
`#fef9ef` zemin) koyup:

```bash
npx capacitor-assets generate
```

## 6. Bilinen tuzaklar

| Konu | Çözüm |
|---|---|
| Çentik / safe area | `viewport-fit=cover` + `env(safe-area-inset-*)` zaten kullanılıyor (`.safe-pad`). |
| Dikey kilit | iOS: Xcode → Deployment Info → yalnızca Portrait. Android: `android:screenOrientation="portrait"`. |
| Çift dokunuşla zoom / uzun basma menüsü | `touch-action: manipulation`, `user-select: none` ayarlı. |
| Klavye açılması | Oyun tuş takımı DOM butonlarıdır; native klavye yalnızca isim alanında açılır. |
| Service worker | Native pakette gereksizdir; `vite-plugin-pwa` kaydı WebView'da zararsızdır ama istenirse `Capacitor.isNativePlatform()` ise `registerSW` atlanabilir. |
| Geri tuşu (Android) | `@capacitor/app` `backButton` olayında `history.back()` çağırın; ana ekranda `App.exitApp()`. |

## 7. Bu fazda yapılmayanlar

Capacitor projesi oluşturulmadı ve mağaza yayını yok; yukarıdaki adımlar mimariyi değiştirmeden uygulanabilir.
