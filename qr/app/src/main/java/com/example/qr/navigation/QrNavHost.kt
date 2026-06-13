package com.example.qr.navigation

import androidx.compose.runtime.Composable
import androidx.navigation3.runtime.NavEntry
import androidx.navigation3.runtime.NavKey
import androidx.navigation3.runtime.rememberNavBackStack
import androidx.navigation3.ui.NavDisplay
import com.example.qr.ui.confirmation.ConfirmationScreen
import com.example.qr.ui.login.LoginScreen
import com.example.qr.ui.main.MainScreen
import com.example.qr.ui.scanner.ScannerScreen

@Composable
fun QrNavHost() {
    val backStack = rememberNavBackStack(Destination.Login)

    NavDisplay(
        backStack = backStack,
        onBack = { if (backStack.size > 1) backStack.removeAt(backStack.size - 1) }
    ) { key: NavKey ->
        when (key) {
            is Destination.Login -> {
                NavEntry(key) {
                    LoginScreen(
                        onLoginSuccess = {
                            backStack.add(Destination.Main)
                        }
                    )
                }
            }
            is Destination.Main -> {
                NavEntry(key) {
                    MainScreen(
                        onStartScan = {
                            backStack.add(Destination.Scanner)
                        }
                    )
                }
            }
            is Destination.Scanner -> {
                NavEntry(key) {
                    ScannerScreen(
                        onQrDetected = { qrCode ->
                            backStack.add(Destination.Confirmation(qrCode, true))
                        },
                        onBack = {
                            backStack.removeAt(backStack.size - 1)
                        }
                    )
                }
            }
            is Destination.Confirmation -> {
                NavEntry(key) {
                    ConfirmationScreen(
                        qrData = key.message,
                        onConfirm = {
                            // Pop confirmation to return to scanner
                            backStack.removeAt(backStack.size - 1)
                        }
                    )
                }
            }
            else -> error("Unknown key $key")
        }
    }
}
