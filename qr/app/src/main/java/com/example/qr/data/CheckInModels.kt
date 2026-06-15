package com.example.qr.data

import kotlinx.serialization.Serializable

@Serializable
data class CheckInRequest(
    val qrData: String
)

@Serializable
data class CheckInResponse(
    val success: Boolean,
    val message: String,
    val patientName: String? = null,
    val time: String? = null
)

@Serializable
data class HistoryEntry(
    val id: String? = null,
    val guest_name: String? = null,
    val scanned_data: String? = null,
    val created_at: String? = null
)

@Serializable
data class LoginRequest(
    val correo: String,
    val password: String
)

@Serializable
data class LoginResponse(
    val ok: Boolean,
    val message: String,
    val user: UserInfo? = null
)

@Serializable
data class UserInfo(
    val id: String,
    val nombre: String,
    val correo: String,
    val rol: String
)
