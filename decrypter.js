// SteamGuard Key extractor

let debug = false;
let accountsDecrypted = [];

// Common Java Classes
const Base64 = Java.use('android.util.Base64');
const GCMParameterSpec = Java.use('javax.crypto.spec.GCMParameterSpec');
const Cipher = Java.use('javax.crypto.Cipher');
const String = Java.use('java.lang.String');
const JSONObject = Java.use('org.json.JSONObject');
const ArrayList = Java.use('java.util.ArrayList');

function extractSteamGuardKeys(decryptedString) {
  // Empty String
  if (decryptedString.length() < 1) {
    return;
  }

  let decryptedJson = JSONObject.$new(decryptedString);
  let accounts = decryptedJson.getJSONObject("accounts");
  
  let accountsIterator = accounts.keySet();
  let accountKeys = ArrayList.$new(accountsIterator);

  for (let i = 0; i < accountKeys.size(); i++) {
    let accountKey = accountKeys.get(i);
    let account = accounts.getJSONObject(accountKey);

    let steamGuardKey = account.getString("shared_secret");
    let accountName = account.getString("account_name");

    if (accountsDecrypted.includes(accountName)) {
      continue;
    }

    let b32Key = base64ToBase32(steamGuardKey);
    console.log("[+] Account: " + accountName + " SteamGuard Key: steam://" + b32Key);

    accountsDecrypted.push(accountName);
  }
}

function base64ToBase32(base64String) {
  const base64Chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
  const base32Chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

  let binaryString = "";
  let padding = 0;

  // Convert Base64 string to binary string
  for (let i = 0; i < base64String.length; i++) {
      if (base64String[i] === '=') {
          padding++;
      } else {
          const charIndex = base64Chars.indexOf(base64String[i]);
          binaryString += ("000000" + charIndex.toString(2)).slice(-6);
      }
  }

  // Remove padding bits
  binaryString = binaryString.slice(0, -padding * 2);

  let base32String = "";
  for (let i = 0; i < binaryString.length; i += 5) {
      const binaryChunk = binaryString.substr(i, 5).padEnd(5, '0');
      base32String += base32Chars[parseInt(binaryChunk, 2)];
  }

  return base32String;
}

Java.perform(() => {
    // Expo AESEncrypter Class
    const AESEncrypter = Java.use('expo.modules.securestore.SecureStoreModule$AESEncrypter');

    // Hook AESEncrypter.decryptItem to decrypt the value
    AESEncrypter.decryptItem.overload('expo.modules.core.Promise', 'org.json.JSONObject', 'java.security.KeyStore$SecretKeyEntry', 'expo.modules.core.arguments.ReadableArguments', 'expo.modules.securestore.AuthenticationCallback').implementation = function (promise, encryptedJson, secretKeyEntry, options, callback) {
      let encodedContent = encryptedJson.getString("ct");
      let iv = encryptedJson.getString("iv");
      let tlen = encryptedJson.getInt("tlen");

      let decodedContent = Base64.decode(encodedContent, 0);

      let parameterSpec = GCMParameterSpec.$new(tlen, Base64.decode(iv, 0));
      let cipher = Cipher.getInstance("AES/GCM/NoPadding");

      cipher.init(2, secretKeyEntry.getSecretKey(), parameterSpec);

      let decrypted = cipher.doFinal(decodedContent);

      let decryptedString = String.$new(decrypted, "UTF-8");
      
      if (debug) {
        console.log("[+] AESEncrypter.decryptItem called. Decrypted: " + decryptedString);
      }

      try {
        extractSteamGuardKeys(decryptedString);
      }
      catch (e) {
        console.log("[!] Error: " + e);
      }

      return this.decryptItem(promise, encryptedJson, secretKeyEntry, options, callback);
    };
  });