package com.example.qr.data

import android.content.Context
import android.content.SharedPreferences

class SessionManager(context: Context) {
    private val prefs: SharedPreferences = context.getSharedPreferences("user_session", Context.MODE_PRIVATE)

    companion object {
        private const val KEY_USER_ID = "user_id"
        private const val KEY_USER_NAME = "user_name"
        private const val KEY_CLINIC_ID = "clinic_id"
    }

    fun saveSession(userId: String, userName: String, clinicId: String?) {
        prefs.edit().apply {
            putString(KEY_USER_ID, userId)
            putString(KEY_USER_NAME, userName)
            putString(KEY_CLINIC_ID, clinicId ?: "AURA_CLINIC_001") // Default si no viene
            apply()
        }
    }

    fun getUserId(): String? = prefs.getString(KEY_USER_ID, null)
    fun getClinicId(): String? = prefs.getString(KEY_CLINIC_ID, "AURA_CLINIC_001")

    fun logout() {
        prefs.edit().clear().apply()
    }
}
