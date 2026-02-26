package com.yourapp.smsreader;

import android.Manifest;
import android.content.pm.PackageManager;
import android.database.Cursor;
import android.net.Uri;
import android.provider.Telephony;
import android.text.TextUtils;

import androidx.core.content.ContextCompat;

import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.Permission;
import com.getcapacitor.annotation.PermissionCallback;

@CapacitorPlugin(
    name = "SmsReader",
    permissions = {
        @Permission(
            alias = "sms",
            strings = {
                Manifest.permission.READ_SMS,
                Manifest.permission.RECEIVE_SMS
            }
        )
    }
)
public class SmsReaderPlugin extends Plugin {
    private static final String SMS_PERMISSION_REQUIRED_MESSAGE = "SMS access required to auto-detect transactions";

    @PluginMethod
    public void checkPermissions(PluginCall call) {
        call.resolve(buildPermissionPayload());
    }

    @PluginMethod
    public void requestPermissions(PluginCall call) {
        if (hasReadSmsPermission()) {
            call.resolve(buildPermissionPayload());
            return;
        }
        requestPermissionForAlias("sms", call, "smsPermissionCallback");
    }

    @PermissionCallback
    private void smsPermissionCallback(PluginCall call) {
        if (call == null) return;
        if (!hasReadSmsPermission()) {
            call.reject(SMS_PERMISSION_REQUIRED_MESSAGE);
            return;
        }
        call.resolve(buildPermissionPayload());
    }

    @PluginMethod
    public void getAllSms(PluginCall call) {
        readMessages(call);
    }

    @PluginMethod
    public void getMessages(PluginCall call) {
        readMessages(call);
    }

    @PermissionCallback
    private void readPermissionCallback(PluginCall call) {
        if (call == null) return;
        if (!hasReadSmsPermission()) {
            call.reject(SMS_PERMISSION_REQUIRED_MESSAGE);
            return;
        }
        readMessages(call);
    }

    private void readMessages(PluginCall call) {
        if (!hasReadSmsPermission()) {
            requestPermissionForAlias("sms", call, "readPermissionCallback");
            return;
        }

        long minDate = call.getLong("minDate", 0L);
        int limitValue = call.getInt("limit", 1000);
        int maxCountValue = call.getInt("maxCount", limitValue);
        int limit = Math.max(1, Math.min(1000, Math.max(limitValue, maxCountValue)));

        JSArray messages = new JSArray();
        Cursor cursor = null;

        try {
            Uri inboxUri = Telephony.Sms.Inbox.CONTENT_URI;
            String[] projection = {
                Telephony.Sms.ADDRESS,
                Telephony.Sms.BODY,
                Telephony.Sms.DATE
            };
            String selection = minDate > 0 ? Telephony.Sms.DATE + " >= ?" : null;
            String[] selectionArgs = minDate > 0 ? new String[] { String.valueOf(minDate) } : null;

            cursor = getContext()
                .getContentResolver()
                .query(
                    inboxUri,
                    projection,
                    selection,
                    selectionArgs,
                    Telephony.Sms.DATE + " DESC"
                );

            if (cursor != null) {
                int addressIndex = cursor.getColumnIndex(Telephony.Sms.ADDRESS);
                int bodyIndex = cursor.getColumnIndex(Telephony.Sms.BODY);
                int dateIndex = cursor.getColumnIndex(Telephony.Sms.DATE);

                while (cursor.moveToNext() && messages.length() < limit) {
                    String body = bodyIndex >= 0 ? cursor.getString(bodyIndex) : "";
                    if (TextUtils.isEmpty(body)) continue;

                    String address = addressIndex >= 0 ? cursor.getString(addressIndex) : "";
                    long date = dateIndex >= 0 ? cursor.getLong(dateIndex) : 0L;

                    JSObject message = new JSObject();
                    message.put("address", address == null ? "" : address);
                    message.put("body", body);
                    message.put("date", date);
                    messages.put(message);
                }
            }
        } catch (SecurityException error) {
            call.reject(SMS_PERMISSION_REQUIRED_MESSAGE);
            return;
        } catch (Exception error) {
            call.reject("Failed to read SMS messages", error);
            return;
        } finally {
            if (cursor != null) {
                cursor.close();
            }
        }

        JSObject response = new JSObject();
        response.put("messages", messages);
        response.put("count", messages.length());
        call.resolve(response);
    }

    private boolean hasReadSmsPermission() {
        return ContextCompat.checkSelfPermission(getContext(), Manifest.permission.READ_SMS)
            == PackageManager.PERMISSION_GRANTED;
    }

    private boolean hasReceiveSmsPermission() {
        return ContextCompat.checkSelfPermission(getContext(), Manifest.permission.RECEIVE_SMS)
            == PackageManager.PERMISSION_GRANTED;
    }

    private JSObject buildPermissionPayload() {
        boolean readGranted = hasReadSmsPermission();
        boolean receiveGranted = hasReceiveSmsPermission();
        String readStatus = readGranted ? "granted" : "denied";
        String receiveStatus = receiveGranted ? "granted" : "denied";

        JSObject payload = new JSObject();
        payload.put("sms", readStatus);
        payload.put("readSms", readStatus);
        payload.put("receiveSms", receiveStatus);
        payload.put("hasPermission", readGranted);
        return payload;
    }
}
