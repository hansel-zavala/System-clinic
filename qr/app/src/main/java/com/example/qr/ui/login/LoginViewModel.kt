package com.example.qr.ui.login

import android.app.Application
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.example.qr.api.AppointmentApi
import com.example.qr.data.LoginRequest
import com.example.qr.data.LoginResponse
import com.example.qr.data.SessionManager
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.launch
import kotlinx.serialization.json.Json
import retrofit2.HttpException

sealed class LoginUiState {
    object Idle : LoginUiState()
    object Loading : LoginUiState()
    data class Success(val message: String) : LoginUiState()
    data class Error(val message: String) : LoginUiState()
}

class LoginViewModel(application: Application) : AndroidViewModel(application) {
    private val api = AppointmentApi.create()
    private val json = Json { ignoreUnknownKeys = true }
    private val sessionManager = SessionManager(application)

    private val _uiState = MutableStateFlow<LoginUiState>(LoginUiState.Idle)
    val uiState: StateFlow<LoginUiState> = _uiState

    fun login(correo: String, password: String, onLoginSuccess: () -> Unit) {
        viewModelScope.launch {
            _uiState.value = LoginUiState.Loading
            try {
                val response = api.login(LoginRequest(correo, password))
                if (response.ok && response.user != null) {
                    sessionManager.saveSession(
                        userId = response.user.id,
                        userName = response.user.nombre,
                        clinicId = "AURA_CLINIC_001" // Valor por defecto
                    )
                    _uiState.value = LoginUiState.Success(response.message)
                    onLoginSuccess()
                } else {
                    _uiState.value = LoginUiState.Error(response.message)
                }
            } catch (e: HttpException) {
                val errorBody = e.response()?.errorBody()?.string()
                val message = try {
                    if (errorBody != null) {
                        json.decodeFromString<LoginResponse>(errorBody).message
                    } else {
                        "Error de autenticación (${e.code()})"
                    }
                } catch (parseEx: Exception) {
                    "Error ${e.code()}: ${e.message()}"
                }
                _uiState.value = LoginUiState.Error(message)
            } catch (e: Exception) {
                _uiState.value = LoginUiState.Error(e.message ?: "Error de conexión")
            }
        }
    }

    fun clearError() {
        _uiState.value = LoginUiState.Idle
    }
}
