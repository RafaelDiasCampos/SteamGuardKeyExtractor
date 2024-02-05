# SteamGuard Key Extractor

Extractor for the SteamGuard key on Android using Frida. This repository was created based on [ExpoAndroidSecureStoreDecrypter](https://github.com/RafaelDiasCampos/ExpoAndroidSecureStoreDecrypter).

## Requirements

* A rooted Android device
* Frida
* The Steam app installed on the device and logged into an account with SteamGuard enabled

## Usage

```console
git clone https://github.com/RafaelDiasCampos/SteamGuardKeyExtractor.git && cd SteamGuardKeyExtractor
frida -U -f com.valvesoftware.android.steam.community -l .\decrypter.js
```

The SteamGuard keys should be printed in the format steam://YOURKEYHERE and can be directly added to some password managers such as [Bitwarden](https://bitwarden.com/help/authenticator-keys/#steam-guard-totps).
