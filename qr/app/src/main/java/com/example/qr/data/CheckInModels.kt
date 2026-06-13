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
