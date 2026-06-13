package com.example.qr.ui.scanner

import android.Manifest
import android.content.pm.PackageManager
import android.util.Log
import android.view.ViewGroup
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.camera.core.CameraSelector
import androidx.camera.core.ImageAnalysis
import androidx.camera.core.Preview
import androidx.camera.lifecycle.ProcessCameraProvider
import androidx.camera.view.PreviewView
import androidx.compose.animation.core.LinearEasing
import androidx.compose.animation.core.RepeatMode
import androidx.compose.animation.core.animateFloat
import androidx.compose.animation.core.infiniteRepeatable
import androidx.compose.animation.core.rememberInfiniteTransition
import androidx.compose.animation.core.tween
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.rounded.ArrowBack
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.IconButtonDefaults
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.CornerRadius
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.BlendMode
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Path
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.LocalLifecycleOwner
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.viewinterop.AndroidView
import androidx.core.content.ContextCompat
import com.google.mlkit.vision.barcode.BarcodeScanning
import com.google.mlkit.vision.common.InputImage
import java.util.concurrent.Executors

@Composable
fun ScannerScreen(
    onQrDetected: (String) -> Unit,
    onBack: () -> Unit
) {
    val context = LocalContext.current
    var hasCameraPermission by remember {
        mutableStateOf(
            ContextCompat.checkSelfPermission(
                context,
                Manifest.permission.CAMERA
            ) == PackageManager.PERMISSION_GRANTED
        )
    }

    val launcher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.RequestPermission(),
        onResult = { granted ->
            hasCameraPermission = granted
        }
    )

    LaunchedEffect(Unit) {
        if (!hasCameraPermission) {
            launcher.launch(Manifest.permission.CAMERA)
        }
    }

    Scaffold(
        topBar = {
            ScannerTopBar(onBack = onBack)
        }
    ) { innerPadding ->
        Box(
            modifier = Modifier
                .fillMaxSize()
                .padding(innerPadding)
                .background(Color.Black)
        ) {
            if (hasCameraPermission) {
                CameraPreview(
                    modifier = Modifier.fillMaxSize(),
                    onQrDetected = onQrDetected
                )
                ScannerOverlay()
            } else {
                Box(
                    modifier = Modifier.fillMaxSize(),
                    contentAlignment = Alignment.Center
                ) {
                    Text(
                        text = "Camera permission is required",
                        color = Color.White,
                        style = MaterialTheme.typography.bodyLarge
                    )
                }
            }
        }
    }
}

@Composable
fun ScannerTopBar(onBack: () -> Unit) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .background(Color(0xFF121212))
            .padding(horizontal = 16.dp, vertical = 12.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        IconButton(
            onClick = onBack,
            colors = IconButtonDefaults.iconButtonColors(
                containerColor = Color.White.copy(alpha = 0.1f),
                contentColor = Color.White
            )
        ) {
            Icon(Icons.AutoMirrored.Rounded.ArrowBack, contentDescription = "Back")
        }
        
        Spacer(modifier = Modifier.weight(1f))
        
        Text(
            text = "Escanear Check-in",
            color = Color.White,
            style = MaterialTheme.typography.titleLarge,
            fontWeight = FontWeight.Bold
        )
        
        Spacer(modifier = Modifier.weight(1f))
        
        // Status indicator dot
        Box(
            modifier = Modifier
                .size(12.dp)
                .background(Color(0xFF00C853), CircleShape)
        )
    }
}

@Composable
fun ScannerOverlay() {
    val infiniteTransition = rememberInfiniteTransition(label = "ScannerAnimation")
    val laserPosition by infiniteTransition.animateFloat(
        initialValue = 0f,
        targetValue = 1f,
        animationSpec = infiniteRepeatable(
            animation = tween(durationMillis = 2000, easing = LinearEasing),
            repeatMode = RepeatMode.Reverse
        ),
        label = "LaserPosition"
    )

    Box(modifier = Modifier.fillMaxSize()) {
        Canvas(modifier = Modifier.fillMaxSize().graphicsLayer(alpha = 0.99f)) {
            val canvasWidth = size.width
            val canvasHeight = size.height
            val boxSize = canvasWidth * 0.7f
            val left = (canvasWidth - boxSize) / 2
            val top = (canvasHeight - boxSize) / 2
            val right = left + boxSize
            val bottom = top + boxSize
            val cornerLength = 40.dp.toPx()
            val strokeWidth = 6.dp.toPx()
            val cornerRadius = 20.dp.toPx()
            val purpleColor = Color(0xFFD0BCFF)

            // 1. Draw the dark background with a transparent hole in the middle
            drawRect(
                color = Color.Black.copy(alpha = 0.7f)
            )
            drawRoundRect(
                color = Color.Transparent,
                topLeft = Offset(left, top),
                size = Size(boxSize, boxSize),
                cornerRadius = CornerRadius(cornerRadius, cornerRadius),
                blendMode = BlendMode.Clear
            )

            // 2. Draw the corner brackets
            // Top Left
            val topLeftPath = Path().apply {
                moveTo(left, top + cornerLength)
                lineTo(left, top + cornerRadius)
                quadraticBezierTo(left, top, left + cornerRadius, top)
                lineTo(left + cornerLength, top)
            }
            drawPath(
                path = topLeftPath,
                color = purpleColor,
                style = Stroke(width = strokeWidth, cap = StrokeCap.Round)
            )

            // Top Right
            val topRightPath = Path().apply {
                moveTo(right - cornerLength, top)
                lineTo(right - cornerRadius, top)
                quadraticBezierTo(right, top, right, top + cornerRadius)
                lineTo(right, top + cornerLength)
            }
            drawPath(
                path = topRightPath,
                color = purpleColor,
                style = Stroke(width = strokeWidth, cap = StrokeCap.Round)
            )

            // Bottom Left
            val bottomLeftPath = Path().apply {
                moveTo(left, bottom - cornerLength)
                lineTo(left, bottom - cornerRadius)
                quadraticBezierTo(left, bottom, left + cornerRadius, bottom)
                lineTo(left + cornerLength, bottom)
            }
            drawPath(
                path = bottomLeftPath,
                color = purpleColor,
                style = Stroke(width = strokeWidth, cap = StrokeCap.Round)
            )

            // Bottom Right
            val bottomRightPath = Path().apply {
                moveTo(right - cornerLength, bottom)
                lineTo(right - cornerRadius, bottom)
                quadraticBezierTo(right, bottom, right, bottom - cornerRadius)
                lineTo(right, bottom - cornerLength)
            }
            drawPath(
                path = bottomRightPath,
                color = purpleColor,
                style = Stroke(width = strokeWidth, cap = StrokeCap.Round)
            )

            // 3. Draw the laser line
            val laserY = top + (boxSize * laserPosition)
            drawLine(
                color = purpleColor,
                start = Offset(left + 10.dp.toPx(), laserY),
                end = Offset(right - 10.dp.toPx(), laserY),
                strokeWidth = 3.dp.toPx(),
                cap = StrokeCap.Round
            )
        }

        Text(
            text = "Encuadre el código QR para validar su cita",
            color = Color.White.copy(alpha = 0.8f),
            style = MaterialTheme.typography.bodyLarge,
            modifier = Modifier
                .align(Alignment.BottomCenter)
                .padding(bottom = 100.dp),
            textAlign = TextAlign.Center
        )
    }
}

@Composable
fun CameraPreview(
    modifier: Modifier = Modifier,
    onQrDetected: (String) -> Unit
) {
    val context = LocalContext.current
    val lifecycleOwner = LocalLifecycleOwner.current
    val cameraExecutor = remember { Executors.newSingleThreadExecutor() }
    val barcodeScanner = remember { BarcodeScanning.getClient() }

    AndroidView(
        factory = { ctx ->
            PreviewView(ctx).apply {
                layoutParams = ViewGroup.LayoutParams(
                    ViewGroup.LayoutParams.MATCH_PARENT,
                    ViewGroup.LayoutParams.MATCH_PARENT
                )
                scaleType = PreviewView.ScaleType.FILL_CENTER
            }
        },
        modifier = modifier,
        update = { previewView ->
            val cameraProviderFuture = ProcessCameraProvider.getInstance(context)
            cameraProviderFuture.addListener({
                val cameraProvider = cameraProviderFuture.get()
                val preview = Preview.Builder().build().also {
                    it.setSurfaceProvider(previewView.surfaceProvider)
                }

                val imageAnalysis = ImageAnalysis.Builder()
                    .setBackpressureStrategy(ImageAnalysis.STRATEGY_KEEP_ONLY_LATEST)
                    .build()
                    .also {
                        it.setAnalyzer(cameraExecutor) { imageProxy ->
                            val mediaImage = imageProxy.image
                            if (mediaImage != null) {
                                val image = InputImage.fromMediaImage(
                                    mediaImage,
                                    imageProxy.imageInfo.rotationDegrees
                                )
                                barcodeScanner.process(image)
                                    .addOnSuccessListener { barcodes ->
                                        for (barcode in barcodes) {
                                            barcode.rawValue?.let { value ->
                                                onQrDetected(value)
                                            }
                                        }
                                    }
                                    .addOnFailureListener { e ->
                                        Log.e("ScannerScreen", "Barcode scanning failed", e)
                                    }
                                    .addOnCompleteListener {
                                        imageProxy.close()
                                    }
                            } else {
                                imageProxy.close()
                            }
                        }
                    }

                val cameraSelector = CameraSelector.DEFAULT_BACK_CAMERA

                try {
                    cameraProvider.unbindAll()
                    cameraProvider.bindToLifecycle(
                        lifecycleOwner,
                        cameraSelector,
                        preview,
                        imageAnalysis
                    )
                } catch (e: Exception) {
                    Log.e("ScannerScreen", "Camera binding failed", e)
                }
            }, ContextCompat.getMainExecutor(context))
        }
    )
}
