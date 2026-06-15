package com.example.qr.api

import com.example.qr.BuildConfig
import com.example.qr.data.CheckInRequest
import com.example.qr.data.CheckInResponse
import com.example.qr.data.HistoryEntry
import com.example.qr.data.LoginRequest
import com.example.qr.data.LoginResponse
import kotlinx.serialization.json.Json
import okhttp3.MediaType.Companion.toMediaType
import retrofit2.Retrofit
import retrofit2.converter.kotlinx.serialization.asConverterFactory
import retrofit2.http.Body
import retrofit2.http.GET
import retrofit2.http.POST

interface AppointmentApi {
    @POST("check-in")
    suspend fun checkIn(@Body request: CheckInRequest): CheckInResponse

    @GET("history")
    suspend fun getHistory(): List<HistoryEntry>

    @POST("../auth/login")
    suspend fun login(@Body request: LoginRequest): LoginResponse

    companion object {
        // Para emulador de Android usa 10.0.2.2. Para dispositivo real usa la IP de tu PC.
        private val BASE_URL = BuildConfig.BASE_URL

        fun create(): AppointmentApi {
            val json = Json { ignoreUnknownKeys = true }
            val contentType = "application/json".toMediaType()
            
            return Retrofit.Builder()
                .baseUrl(BASE_URL)
                .addConverterFactory(json.asConverterFactory(contentType))
                .build()
                .create(AppointmentApi::class.java)
        }
    }
}
