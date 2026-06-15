package com.example.qr.ui.confirmation

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.rounded.Check
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.ModalBottomSheet
import androidx.compose.material3.Text
import androidx.compose.material3.rememberModalBottomSheetState
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.tooling.preview.Preview
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.qr.api.AppointmentApi
import com.example.qr.data.CheckInRequest
import com.example.qr.ui.login.LoginScreen
import com.example.qr.ui.theme.QrTheme

sealed interface ConfirmationState {
    data object Loading : ConfirmationState
    data class Success(val patientName: String, val time: String) : ConfirmationState
    data class Error(val message: String) : ConfirmationState
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ConfirmationScreen(
    qrData: String,
    onConfirm: () -> Unit
) {
    var state by remember { mutableStateOf<ConfirmationState>(ConfirmationState.Loading) }
    val api = remember { AppointmentApi.create() }
    val sheetState = rememberModalBottomSheetState(skipPartiallyExpanded = true)

    LaunchedEffect(qrData) {
        state = try {
            val response = api.checkIn(CheckInRequest(qrData))
            if (response.success) {
                ConfirmationState.Success(response.patientName ?: "Paciente", response.time ?: "--:--")
            } else {
                ConfirmationState.Error(response.message)
            }
        } catch (e: Exception) {
            ConfirmationState.Error("Error de conexión: ${e.message}")
        }
    }

    Box(modifier = Modifier.fillMaxSize()) {
        ModalBottomSheet(
            onDismissRequest = onConfirm,
            sheetState = sheetState,
            containerColor = Color(0xFF252329),
            dragHandle = null,
            shape = RoundedCornerShape(topStart = 32.dp, topEnd = 32.dp)
        ) {
            ConfirmationSheetContent(
                state = state,
                onConfirm = onConfirm
            )
        }
    }
}

@Composable
fun ConfirmationSheetContent(
    state: ConfirmationState,
    onConfirm: () -> Unit
) {
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .padding(24.dp)
    ) {
        when (val currentState = state) {
            is ConfirmationState.Loading -> {
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(300.dp),
                    contentAlignment = Alignment.Center
                ) {
                    CircularProgressIndicator(color = Color(0xFFD0BCFF))
                }
            }
            is ConfirmationState.Success -> {
                SuccessContent(
                    patientName = currentState.patientName,
                    time = currentState.time,
                    onConfirm = onConfirm
                )
            }
            is ConfirmationState.Error -> {
                ErrorContent(
                    message = currentState.message,
                    onConfirm = onConfirm
                )
            }
        }
    }
}


@Composable
fun SuccessContent(
    patientName: String,
    time: String,
    onConfirm: () -> Unit
) {
    Column {
        Row(verticalAlignment = Alignment.CenterVertically) {
            // Checkmark Icon in rounded box
            Box(
                modifier = Modifier
                    .size(56.dp)
                    .background(Color(0xFF6750A4), RoundedCornerShape(16.dp)),
                contentAlignment = Alignment.Center
            ) {
                Icon(
                    imageVector = Icons.Rounded.Check,
                    contentDescription = null,
                    tint = Color.White,
                    modifier = Modifier.size(32.dp)
                )
            }
            
            Spacer(modifier = Modifier.width(16.dp))
            
            Column {
                Text(
                    text = "Check-in Exitoso",
                    color = Color.White,
                    style = MaterialTheme.typography.titleLarge,
                    fontWeight = FontWeight.Bold
                )
                Text(
                    text = "Sincronizado con el portal de citas",
                    color = Color.White.copy(alpha = 0.6f),
                    style = MaterialTheme.typography.bodyMedium
                )
            }
        }
        
        Spacer(modifier = Modifier.height(32.dp))
        
        // Detail Card
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .background(Color.White.copy(alpha = 0.05f), RoundedCornerShape(16.dp))
                .padding(20.dp)
        ) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Column {
                    Text(
                        text = "PACIENTE",
                        color = Color(0xFFD0BCFF),
                        style = MaterialTheme.typography.labelSmall,
                        fontWeight = FontWeight.Bold
                    )
                    Spacer(modifier = Modifier.height(4.dp))
                    Text(
                        text = patientName,
                        color = Color.White,
                        style = MaterialTheme.typography.titleMedium,
                        fontWeight = FontWeight.Bold
                    )
                }
                
                Column(horizontalAlignment = Alignment.End) {
                    Text(
                        text = "HORA",
                        color = Color(0xFFD0BCFF),
                        style = MaterialTheme.typography.labelSmall,
                        fontWeight = FontWeight.Bold
                    )
                    Spacer(modifier = Modifier.height(4.dp))
                    Text(
                        text = time,
                        color = Color.White,
                        style = MaterialTheme.typography.titleMedium,
                        fontWeight = FontWeight.Bold
                    )
                }
            }
        }
        
        Spacer(modifier = Modifier.height(32.dp))
        
        // Confirm Button
        Button(
            onClick = onConfirm,
            modifier = Modifier
                .fillMaxWidth()
                .height(64.dp),
            shape = RoundedCornerShape(32.dp),
            colors = ButtonDefaults.buttonColors(
                containerColor = Color(0xFFD0BCFF), // Light purple button
                contentColor = Color(0xFF381E72)
            )
        ) {
            Text(
                text = "CONFIRMAR Y CONTINUAR",
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.Bold,
                letterSpacing = 1.sp
            )
        }
        
        Spacer(modifier = Modifier.height(16.dp))
    }
}

@Composable
fun ErrorContent(
    message: String,
    onConfirm: () -> Unit
) {
    Column(horizontalAlignment = Alignment.CenterHorizontally) {
        Text(
            text = "Error de Check-in",
            color = MaterialTheme.colorScheme.error,
            style = MaterialTheme.typography.titleLarge,
            fontWeight = FontWeight.Bold
        )
        Spacer(modifier = Modifier.height(8.dp))
        Text(
            text = message,
            color = Color.White.copy(alpha = 0.8f),
            style = MaterialTheme.typography.bodyMedium
        )
        Spacer(modifier = Modifier.height(32.dp))
        Button(
            onClick = onConfirm,
            modifier = Modifier.fillMaxWidth()
        ) {
            Text("REINTENTAR")
        }
    }
}

@Preview(showBackground = true)
@Composable
fun ConfirmationScreenPreview() {
    QrTheme {
        Box(
            modifier = Modifier
                .fillMaxSize()
                .background(Color.Black)
        ) {
            // We preview the content directly to avoid ModalBottomSheet's 
            // internal render issues in Preview (IndexOutOfBoundsException)
            Box(
                modifier = Modifier
                    .align(Alignment.BottomCenter)
                    .background(
                        color = Color(0xFF252329),
                        shape = RoundedCornerShape(topStart = 32.dp, topEnd = 32.dp)
                    )
            ) {
                ConfirmationSheetContent(
                    state = ConfirmationState.Success("Juan Pérez", "10:30 AM"),
                    onConfirm = {}
                )
            }
        }
    }
}
