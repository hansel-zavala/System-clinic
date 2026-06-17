package com.example.qr.data

import android.content.Context
import android.content.SharedPreferences

class SessionManager(context: Context) {
    private val prefs: SharedPreferences = context.getSharedPreferences("user_session", Context.MODE_PRIVATE)

    companion object {
        private const val KEY_USER_ID = "user_id"
        private const val KEY_USER_NAME = "user_name"
        private const val KEY_USER_EMAIL = "user_email"
        private const val KEY_USER_ROLE = "user_role"
        private const val KEY_CLINIC_ID = "clinic_id"
        private const val KEY_PHOTO_URL = "foto_url"
    }

    fun saveSession(
        userId: String,
        photoUrl: String?,
        userName: String,
        email: String,
        role: String,
        clinicId: String?
    ) {
        prefs.edit().apply {
            putString(KEY_USER_ID, userId)
            putString(KEY_PHOTO_URL, photoUrl)
            putString(KEY_USER_NAME, userName)
            putString(KEY_USER_EMAIL, email)
            putString(KEY_USER_ROLE, role)
            putString(KEY_CLINIC_ID, clinicId ?: "AURA_CLINIC_001")
            apply()
        }
    }

    fun getUserId(): String? = prefs.getString(KEY_USER_ID, null)
    fun getPhotoUrl(): String? = prefs.getString(KEY_PHOTO_URL, null)
    fun getUserName(): String = prefs.getString(KEY_USER_NAME, "Usuario") ?: "Usuario"
    fun getUserEmail(): String = prefs.getString(KEY_USER_EMAIL, "") ?: ""
    fun getUserRole(): String = prefs.getString(KEY_USER_ROLE, "Staff") ?: "Staff"
    fun getClinicId(): String? = prefs.getString(KEY_CLINIC_ID, "AURA_CLINIC_001")

    fun logout() {
        prefs.edit().clear().apply()
    }
}
