package com.example.qr.navigation

import androidx.navigation3.runtime.NavKey
import kotlinx.serialization.Serializable

@Serializable
sealed interface Destination : NavKey {
    @Serializable
    data object Login : Destination

    @Serializable
    data object Main : Destination

    @Serializable
    data object Scanner : Destination

    @Serializable
    data class Confirmation(val message: String, val isSuccess: Boolean) : Destination
}
