package com.example.qr.data

import kotlinx.serialization.Serializable

@Serializable
data class CheckInRequest(
    val qrData: String,
    val userId: String? = null,
    val clinicId: String? = null
)

@Serializable
data class CheckInResponse(
    val success: Boolean,
    val message: String,
    val patientName: String? = null,
    val time: String? = null
)

@Serializable
data class HistoryResponse(
    val ok: Boolean,
    val data: List<HistoryEntry>
)

@Serializable
data class HistoryEntry(
    val id: String? = null,
    val userId: String? = null,
    val patientName: String? = null,
    val scannedData: String? = null,
    val createdAt: String? = null
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
