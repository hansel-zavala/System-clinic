package com.example.qr.ui.main

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.example.qr.api.AppointmentApi
import com.example.qr.data.HistoryEntry
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.launch

sealed class HistoryUiState {
    object Loading : HistoryUiState()
    data class Success(val entries: List<HistoryEntry>) : HistoryUiState()
    data class Error(val message: String) : HistoryUiState()
}

class HistoryViewModel : ViewModel() {
    private val api = AppointmentApi.create()

    private val _uiState = MutableStateFlow<HistoryUiState>(HistoryUiState.Loading)
    val uiState: StateFlow<HistoryUiState> = _uiState

    init {
        fetchHistory()
    }

    fun fetchHistory() {
        viewModelScope.launch {
            _uiState.value = HistoryUiState.Loading
            try {
                val entries = api.getHistory()
                _uiState.value = HistoryUiState.Success(entries)
            } catch (e: Exception) {
                _uiState.value = HistoryUiState.Error(e.message ?: "Error desconocido")
            }
        }
    }
}
