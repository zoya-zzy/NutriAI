import { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { 
  ArrowLeft, Camera as CameraIcon, Upload, X, Sparkles, 
  Loader2, CheckCircle, ChefHat, Circle, AlertCircle
} from 'lucide-react'
import { recognizeFood } from '../api/foodRecognition.js'
import { useNutri } from '../store/NutriContext.jsx'

export default function Camera() {
  const navigate = useNavigate()
  const { addFood } = useNutri()
  
  const fileInputRef = useRef(null)
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const streamRef = useRef(null)

  const [imagePreview, setImagePreview] = useState(null)
  const [imageFile, setImageFile] = useState(null) // File/Blob 对象用于上传
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [recognizing, setRecognizing] = useState(false)
  const [result, setResult] = useState(null)
  const [added, setAdded] = useState(false)
  const [mealSlot, setMealSlot] = useState('dinner')
  
  // Camera states
  const [cameraMode, setCameraMode] = useState(false)
  const [cameraStream, setCameraStream] = useState(null)
  const [cameraError, setCameraError] = useState(null)
  const [isCapturing, setIsCapturing] = useState(false)

  // Cleanup object URL
  const revokeUrl = useCallback((url) => {
    if (url && url.startsWith('blob:')) {
      URL.revokeObjectURL(url)
    }
  }, [])

  // Stop camera stream
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }
    setCameraStream(null)
    setCameraMode(false)
  }, [])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (imagePreview?.startsWith('blob:')) {
        URL.revokeObjectURL(imagePreview)
      }
      stopCamera()
    }
  }, [])

  // ============== 图片上传 ==============
  const handleFileSelect = (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    // 生成预览 URL
    const previewUrl = URL.createObjectURL(file)
    setImagePreview(previewUrl)
    setImageFile(file)

    // 直接使用 File 对象调用识别
    startRecognition(file)

    // 清空 input 值，允许重复选择同一文件
    e.target.value = ''
  }

  // ============== 摄像头 ==============
  const openCamera = async () => {
    setCameraError(null)
    setCameraMode(true)
    
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('浏览器不支持摄像头访问')
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false
      })
      
      streamRef.current = stream
      setCameraStream(stream)
      
      // 等待 video 元素挂载
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream
        }
      }, 100)
    } catch (err) {
      console.error('Camera access failed:', err)
      setCameraMode(false)
      setCameraError(
        err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError'
          ? '摄像头权限被拒绝，请在浏览器设置中允许访问'
          : err.name === 'NotFoundError'
          ? '未检测到摄像头设备'
          : '无法访问摄像头：' + err.message
      )
    }
  }

  const closeCamera = () => {
    stopCamera()
  }

  const capturePhoto = async () => {
    if (!videoRef.current || !cameraStream) return
    
    setIsCapturing(true)
    
    try {
      const video = videoRef.current
      const canvas = canvasRef.current
      
      // 设置 canvas 尺寸为视频实际尺寸
      const videoWidth = video.videoWidth
      const videoHeight = video.videoHeight
      
      // 计算裁剪区域（居中正方形）
      const size = Math.min(videoWidth, videoHeight)
      const offsetX = (videoWidth - size) / 2
      const offsetY = (videoHeight - size) / 2
      
      canvas.width = size
      canvas.height = size
      
      const ctx = canvas.getContext('2d')
      ctx.drawImage(video, offsetX, offsetY, size, size, 0, 0, size, size)
      
      // 转换为 base64 (JPEG, 0.92 质量)
      const dataUrl = canvas.toDataURL('image/jpeg', 0.92)
      
      // 转换为 File 对象用于上传
      const response = await fetch(dataUrl)
      const blob = await response.blob()
      const photoFile = new File([blob], `photo_${Date.now()}.jpg`, { type: 'image/jpeg' })
      
      // 停止摄像头
      stopCamera()
      
      // 设置预览和文件
      setImagePreview(dataUrl)
      setImageFile(photoFile)
      
      // 自动开始识别
      startRecognition(photoFile)
    } catch (err) {
      console.error('Photo capture failed:', err)
      setCameraError('拍照失败：' + err.message)
    } finally {
      setIsCapturing(false)
    }
  }

  // ============== 识别流程 ==============
  const startRecognition = async (fileOrBlob) => {
    setUploading(true)
    setUploadProgress(0)
    setResult(null)
    
    // 模拟上传进度（仅用于 UI 反馈）
    const progressInterval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 90) return 90
        return prev + Math.random() * 15
      })
    }, 100)
    
    try {
      const food = await recognizeFood(fileOrBlob)
      
      clearInterval(progressInterval)
      setUploadProgress(100)
      setUploading(false)
      setRecognizing(true)
      
      if (food.success) {
        setResult({
          foodName: food.foodName,
          emoji: food.emoji,
          calories: food.calories,
          protein: food.protein,
          carbs: food.carbs,
          fat: food.fat,
          confidence: food.confidence
        })
      }
    } catch (e) {
      clearInterval(progressInterval)
      setUploading(false)
      setRecognizing(false)
      console.error('Recognition failed:', e)
      // 显示错误
      setResult({
        foodName: '',
        emoji: '',
        calories: 0,
        protein: 0,
        carbs: 0,
        fat: 0,
        confidence: 0,
        error: e.message
      })
    } finally {
      clearInterval(progressInterval)
      setRecognizing(false)
    }
  }

  // ============== 添加到日记 ==============
  const handleAddToDiary = async () => {
    if (!result) return

    try {
      addFood(
        {
          foodName: result.foodName,
          calories: result.calories,
          protein: result.protein,
          carbs: result.carbs,
          fat: result.fat,
          emoji: result.emoji,
        },
        mealSlot
      )

      setAdded(true)
      setTimeout(() => {
        navigate('/')
      }, 1500)
    } catch (e) {
      console.error('Failed to add:', e)
    }
  }

  // ============== 重置 ==============
  const reset = () => {
    if (imagePreview?.startsWith('blob:')) {
      URL.revokeObjectURL(imagePreview)
    }
    setImagePreview(null)
    setImageFile(null)
    setResult(null)
    setAdded(false)
    setUploadProgress(0)
    setCameraError(null)
  }

  const mealSlots = [
    { value: 'breakfast', label: '早餐', icon: '🥐' },
    { value: 'lunch', label: '午餐', icon: '🍱' },
    { value: 'dinner', label: '晚餐', icon: '🍽️' },
    { value: 'snack', label: '零食', icon: '🍎' }
  ]

  return (
    <div className="min-h-screen bg-cream-50">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-100"
      >
        <div className="flex items-center justify-between px-5 py-4">
          <button
            onClick={() => {
              stopCamera()
              navigate(-1)
            }}
            className="p-2 -ml-2 rounded-xl hover:bg-gray-100 transition-colors"
          >
            <ArrowLeft size={22} />
          </button>
          <h1 className="text-lg font-semibold text-gray-800">拍照识别</h1>
          <div className="w-8" />
        </div>
      </motion.div>

      <div className="px-5 py-6 space-y-6">
        {/* Camera Mode */}
        {cameraMode && cameraStream ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative"
          >
            <div className="aspect-square bg-black rounded-3xl overflow-hidden relative">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />
              
              {/* 取景框 */}
              <div className="absolute inset-0 pointer-events-none">
                <div className="absolute inset-6 border-2 border-white/40 rounded-2xl" />
              </div>
              
              {/* 扫描线 */}
              <motion.div
                initial={{ top: '15%' }}
                animate={{ top: '85%' }}
                transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
                className="absolute left-8 right-8 h-0.5 bg-gradient-to-r from-transparent via-warm-400 to-transparent rounded-full shadow-lg shadow-warm-400/50"
              />

              {/* 关闭按钮 */}
              <button
                onClick={closeCamera}
                className="absolute top-4 right-4 p-2 bg-black/50 backdrop-blur-sm rounded-full text-white hover:bg-black/70 transition-colors"
              >
                <X size={20} />
              </button>

              {/* 拍照按钮 */}
              <div className="absolute bottom-6 left-0 right-0 flex justify-center">
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={capturePhoto}
                  disabled={isCapturing}
                  className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-2xl border-4 border-white/30"
                >
                  <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center">
                    <Circle size={32} className="text-coral-500 fill-coral-500" />
                  </div>
                </motion.button>
              </div>

              <p className="absolute bottom-24 left-0 right-0 text-center text-white/80 text-sm">
                将食物对准取景框
              </p>
            </div>
          </motion.div>
        ) : cameraError ? (
          // 摄像头错误
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="aspect-square bg-gradient-to-br from-gray-100 to-gray-200 rounded-3xl flex flex-col items-center justify-center p-6 text-center"
          >
            <div className="w-20 h-20 bg-coral-50 rounded-full flex items-center justify-center mb-4">
              <AlertCircle size={40} className="text-coral-500" />
            </div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">摄像头不可用</h3>
            <p className="text-sm text-gray-500 mb-6 max-w-xs">{cameraError}</p>
            <div className="flex gap-3">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setCameraError(null)}
                className="px-5 py-3 bg-gray-100 rounded-xl font-medium text-gray-700"
              >
                返回
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={openCamera}
                className="px-5 py-3 bg-primary-500 text-white rounded-xl font-medium"
              >
                重试
              </motion.button>
            </div>
          </motion.div>
        ) : (
          // 图片预览区 / 占位区
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative"
          >
            <div className="aspect-square bg-gradient-to-br from-gray-100 to-gray-200 rounded-3xl overflow-hidden relative">
              <AnimatePresence mode="wait">
                {imagePreview ? (
                  <motion.div
                    key="preview"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0"
                  >
                    <img
                      src={imagePreview}
                      alt="Food"
                      className="w-full h-full object-cover"
                    />
                    
                    {/* Uploading Overlay */}
                    {uploading && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center text-white"
                      >
                        <div className="w-16 h-16 rounded-full border-4 border-white/30 border-t-white animate-spin mb-4" />
                        <p className="text-lg font-medium">正在上传...</p>
                        <div className="w-48 h-2 bg-white/20 rounded-full mt-3 overflow-hidden">
                          <motion.div
                            className="h-full bg-white rounded-full"
                            animate={{ width: `${uploadProgress}%` }}
                            transition={{ duration: 0.2 }}
                          />
                        </div>
                        <p className="text-sm text-white/70 mt-2">{uploadProgress}%</p>
                      </motion.div>
                    )}
                    
                    {/* Recognizing Overlay */}
                    {recognizing && !uploading && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center text-white"
                      >
                        <Loader2 size={48} className="animate-spin mb-3" />
                        <p className="text-lg font-medium">AI analyzing...</p>
                        <p className="text-sm text-white/70 mt-1">正在识别食物中</p>
                      </motion.div>
                    )}
                    
                    <button
                      onClick={reset}
                      className="absolute top-3 right-3 p-2 bg-white/90 rounded-full shadow-lg hover:bg-white transition-colors"
                    >
                      <X size={18} className="text-gray-700" />
                    </button>
                  </motion.div>
                ) : (
                  <motion.div
                    key="placeholder"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 flex flex-col items-center justify-center"
                  >
                    <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center shadow-lg mb-4">
                      <CameraIcon size={40} className="text-gray-400" />
                    </div>
                    <p className="text-gray-500 text-center px-6 font-medium">
                      Upload Food Image
                    </p>
                    <p className="text-gray-400 text-xs mt-1">上传食物图片开始识别</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Scan Line when recognizing */}
            {recognizing && !uploading && (
              <motion.div
                initial={{ top: '10%' }}
                animate={{ top: '90%' }}
                transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
                className="absolute left-4 right-4 h-0.5 bg-gradient-to-r from-transparent via-primary-500 to-transparent rounded-full shadow-lg shadow-primary-500/50"
              />
            )}
          </motion.div>
        )}

        {/* Action Buttons - 仅在无图片且无摄像头时显示 */}
        {!imagePreview && !cameraMode && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="grid grid-cols-2 gap-4"
          >
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => fileInputRef.current?.click()}
              className="flex flex-col items-center gap-3 p-5 bg-white rounded-2xl shadow-card border border-gray-100 hover:border-primary-200 transition-colors"
            >
              <div className="w-14 h-14 bg-primary-50 rounded-2xl flex items-center justify-center">
                <Upload size={24} className="text-primary-500" />
              </div>
              <span className="font-medium text-gray-700">上传图片</span>
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={openCamera}
              className="flex flex-col items-center gap-3 p-5 bg-white rounded-2xl shadow-card border border-gray-100 hover:border-primary-200 transition-colors"
            >
              <div className="w-14 h-14 bg-warm-100 rounded-2xl flex items-center justify-center">
                <CameraIcon size={24} className="text-warm-500" />
              </div>
              <span className="font-medium text-gray-700">拍照识别</span>
            </motion.button>
          </motion.div>
        )}

        {/* Hidden File Input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
        />

        {/* Canvas for photo capture (hidden) */}
        <canvas ref={canvasRef} className="hidden" />

        {/* Recognition Result */}
        <AnimatePresence>
          {result && !recognizing && !uploading && (
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              className="space-y-4"
            >
              {/* Result Card */}
              <div className="bg-white rounded-2xl p-5 shadow-card">
                <div className="flex items-center gap-2 mb-4">
                  <Sparkles size={18} className="text-warm-500" />
                  <span className="text-sm text-gray-500">AI 识别结果</span>
                  <span className="ml-auto text-xs text-primary-500 bg-primary-50 px-2 py-1 rounded-full">
                    {(result.confidence * 100).toFixed(0)}% 置信度
                  </span>
                </div>

                <div className="flex items-center gap-4 mb-4 p-3 bg-gradient-to-r from-warm-50 to-primary-50 rounded-xl">
                  <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-4xl shadow-sm">
                    {result.emoji}
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wider">Detected Food</p>
                    <h3 className="text-xl font-bold text-gray-800">{result.foodName}</h3>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-warm-50 rounded-xl p-3 text-center">
                    <p className="text-xs text-gray-500 mb-1">Calories</p>
                    <p className="font-bold text-gray-800 text-lg">{result.calories}</p>
                    <p className="text-xs text-gray-400">kcal</p>
                  </div>
                  <div className="bg-primary-50 rounded-xl p-3 text-center">
                    <p className="text-xs text-gray-500 mb-1">Protein</p>
                    <p className="font-bold text-primary-600 text-lg">{result.protein}</p>
                    <p className="text-xs text-gray-400">g</p>
                  </div>
                  <div className="bg-blue-50 rounded-xl p-3 text-center">
                    <p className="text-xs text-gray-500 mb-1">Fat</p>
                    <p className="font-bold text-blue-600 text-lg">{result.fat}</p>
                    <p className="text-xs text-gray-400">g</p>
                  </div>
                </div>

                {/* Meal Slot Selection */}
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <p className="text-xs font-medium text-gray-500 mb-3">添加到哪一餐？</p>
                  <div className="grid grid-cols-4 gap-2">
                    {mealSlots.map((slot) => (
                      <motion.button
                        key={slot.value}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setMealSlot(slot.value)}
                        className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all ${
                          mealSlot === slot.value
                            ? 'bg-primary-100 border-2 border-primary-400'
                            : 'bg-gray-50 border-2 border-transparent hover:bg-gray-100'
                        }`}
                      >
                        <span className="text-lg">{slot.icon}</span>
                        <span className={`text-xs font-medium ${
                          mealSlot === slot.value ? 'text-primary-600' : 'text-gray-600'
                        }`}>
                          {slot.label}
                        </span>
                      </motion.button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Add to Diary Button */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleAddToDiary}
                disabled={added}
                className={`w-full py-4 rounded-2xl font-semibold text-lg shadow-xl transition-all flex items-center justify-center gap-2 ${
                  added
                    ? 'bg-primary-100 text-primary-500'
                    : 'bg-gradient-to-r from-primary-500 to-primary-400 text-white shadow-primary-500/25'
                }`}
              >
                {added ? (
                  <span className="flex items-center justify-center gap-2">
                    <CheckCircle size={22} />
                    Added to today's diary
                  </span>
                ) : (
                  <>
                    <ChefHat size={22} />
                    Add to Diary
                  </>
                )}
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Tips */}
        {!imagePreview && !cameraMode && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="bg-warm-50 rounded-2xl p-4"
          >
            <p className="text-sm text-warm-600">
              💡 <span className="font-medium">拍照小贴士：</span>
              将食物放在光线充足的地方，从上方45度角拍摄效果最佳。
            </p>
          </motion.div>
        )}
      </div>
    </div>
  )
}
