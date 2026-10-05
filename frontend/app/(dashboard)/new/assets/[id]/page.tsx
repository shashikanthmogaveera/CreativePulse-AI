'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import DashboardLayout from '@/components/DashboardLayout'
import CloudinaryUploader from '@/components/CloudinaryUploader'
import { api } from '@/lib/api'
import { getErrorMessage } from '@/lib/apiError'
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Image as ImageIcon,
  Sparkles
} from 'lucide-react'
import { Button, Card } from '@/components/ui'

interface Asset {
  id: number
  creative_id: string
  filename: string
  secure_url: string | null | undefined
  source: string
  created_at: string
}

export default function AssetUploadPage() {
  const router = useRouter()
  const params = useParams()
  const analysisId = params.id ? parseInt(params.id as string) : null

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [cloudinaryConfigured, setCloudinaryConfigured] = useState(false)
  
  const [creativeIds, setCreativeIds] = useState<string[]>([])
  const [assets, setAssets] = useState<Record<string, Asset>>({})
  const [uploadErrors, setUploadErrors] = useState<Record<string, string>>({})
  
  // Continue/Run state
  const [isRunning, setIsRunning] = useState(false)
  const [runError, setRunError] = useState<string | null>(null)
  const [currentStage, setCurrentStage] = useState<string>('')

  useEffect(() => {
    if (!analysisId) return
    loadData()
  }, [analysisId])

  const loadData = async () => {
    if (!analysisId) return
    
    setLoading(true)
    setError(null)

    try {
      // Check Cloudinary status
      const cloudinaryStatus = await api.getCloudinaryStatus()
      setCloudinaryConfigured(cloudinaryStatus.configured)

      // Get analysis to fetch performance records
      const analysis = await api.getAnalysis(analysisId)
      
      // Get creative IDs from performance data
      const performanceData = await api.getAnalysisPerformance(analysisId)
      const uniqueIds = Array.from(
        new Set(performanceData.records.map((r) => r.creative_id))
      ).sort()
      setCreativeIds(uniqueIds)

      // Get existing assets
      const existingAssets = await api.listAssets(analysisId)
      const assetMap: Record<string, Asset> = {}
      existingAssets.forEach((asset) => {
        assetMap[asset.creative_id] = asset as Asset
      })
      setAssets(assetMap)
    } catch (err) {
      setError(getErrorMessage(err) || 'Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  const handleUploadSuccess = (creativeId: string, assetData: any) => {
    // Add to assets map
    setAssets(prev => ({
      ...prev,
      [creativeId]: assetData
    }))

    // Clear any error for this creative
    setUploadErrors(prev => {
      const newErrors = { ...prev }
      delete newErrors[creativeId]
      return newErrors
    })
  }

  const handleUploadError = (creativeId: string, errorMsg: string) => {
    setUploadErrors(prev => ({
      ...prev,
      [creativeId]: errorMsg
    }))
  }

  const getUploadStats = () => {
    const total = creativeIds.length
    const uploaded = Object.keys(assets).filter(id => assets[id].source === 'cloudinary').length
    const placeholders = Object.keys(assets).filter(id => assets[id].source === 'local_demo').length
    return { total, uploaded, placeholders, remaining: total - uploaded - placeholders }
  }

  const handleContinue = async () => {
    if (!analysisId) return
    
    setRunError(null)
    setIsRunning(true)
    setCurrentStage('Starting analysis...')
    
    try {
      // Start the analysis pipeline
      await api.runAnalysis(analysisId)
      setCurrentStage('Analysis started successfully')
      
      // Poll for status updates
      const pollInterval = setInterval(async () => {
        try {
          const status = await api.getAnalysisStatus(analysisId)
          setCurrentStage(status.current_stage || 'Processing...')
          
          if (status.status === 'completed') {
            clearInterval(pollInterval)
            setCurrentStage('Analysis completed!')
            setTimeout(() => router.push('/dashboard'), 1500)
          } else if (status.status === 'failed') {
            clearInterval(pollInterval)
            setIsRunning(false)
            setRunError(status.error_message || 'Analysis failed. Please check the logs.')
          }
        } catch (err) {
          // Continue polling on transient errors
          console.error('Polling error:', err)
        }
      }, 2000)
      
      // Cleanup on unmount
      return () => clearInterval(pollInterval)
    } catch (err) {
      setIsRunning(false)
      setRunError(getErrorMessage(err) || 'Failed to start analysis')
    }
  }

  const stats = getUploadStats()

  if (!analysisId) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <p className="text-danger-400">Invalid analysis ID</p>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.back()}
            className="flex items-center space-x-2 text-text-secondary hover:text-text-primary mb-4 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Analysis</span>
          </button>

          <h1 className="text-3xl font-bold text-text-primary mb-2">
            Upload Creative Assets
          </h1>
          <p className="text-text-secondary">
            Upload actual creative images for visual feature extraction and Creative DNA analysis.
          </p>
        </div>

        {error && (
          <Card className="mb-6 bg-danger-600/10 border-danger-600/30">
            <div className="flex items-start space-x-3">
              <XCircle className="w-5 h-5 text-danger-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-danger-400 font-medium">Error</p>
                <p className="text-text-secondary text-sm mt-1">{error}</p>
              </div>
            </div>
          </Card>
        )}

        {/* Cloudinary Status */}
        <Card className={`mb-6 ${cloudinaryConfigured ? 'border-success-500/30 bg-success-500/5' : 'border-warning-600/30 bg-warning-600/5'}`}>
          <div className="flex items-start space-x-3">
            <Sparkles className={`w-5 h-5 flex-shrink-0 mt-0.5 ${cloudinaryConfigured ? 'text-success-400' : 'text-warning-400'}`} />
            <div className="flex-1">
              <p className={`font-medium ${cloudinaryConfigured ? 'text-success-400' : 'text-warning-400'}`}>
                {cloudinaryConfigured ? 'Cloudinary Configured' : 'Cloudinary Not Configured'}
              </p>
              <p className="text-text-secondary text-sm mt-1">
                {cloudinaryConfigured
                  ? 'You can upload images directly to Cloudinary. Images are securely stored and processed for visual analysis.'
                  : 'Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET in backend/.env to enable uploads.'}
              </p>
            </div>
          </div>
        </Card>

        {/* Upload Stats */}
        {!loading && (
          <Card className="mb-6">
            <div className="grid grid-cols-4 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-text-primary">{stats.total}</div>
                <div className="text-xs text-text-tertiary">Total Creatives</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-success-400">{stats.uploaded}</div>
                <div className="text-xs text-text-tertiary">Uploaded</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-text-tertiary">{stats.placeholders}</div>
                <div className="text-xs text-text-tertiary">Placeholders</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-warning-400">{stats.remaining}</div>
                <div className="text-xs text-text-tertiary">Remaining</div>
              </div>
            </div>
          </Card>
        )}

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
            <p className="text-text-tertiary mt-4">Loading creative IDs...</p>
          </div>
        ) : creativeIds.length === 0 ? (
          <Card className="text-center py-12">
            <ImageIcon className="w-12 h-12 text-text-tertiary mx-auto mb-4" />
            <p className="text-text-primary font-medium mb-2">No Creative IDs Found</p>
            <p className="text-text-secondary text-sm">
              Upload performance data first to see creative IDs here.
            </p>
          </Card>
        ) : (
          <div className="space-y-4">
            {creativeIds.map(creativeId => {
              const asset = assets[creativeId]
              const isUploaded = asset && asset.source === 'cloudinary'
              const isPlaceholder = asset && asset.source === 'local_demo'
              const uploadError = uploadErrors[creativeId]

              return (
                <Card key={creativeId}>
                  <div className="flex items-start space-x-4">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-3">
                        <h3 className="text-lg font-semibold text-text-primary font-mono">
                          {creativeId}
                        </h3>
                        {isUploaded && (
                          <span className="px-2 py-0.5 bg-success-500/20 text-success-400 text-xs font-medium rounded-full flex items-center space-x-1">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Uploaded</span>
                          </span>
                        )}
                        {isPlaceholder && (
                          <span className="px-2 py-0.5 bg-text-tertiary/20 text-text-tertiary text-xs font-medium rounded-full">
                            Placeholder
                          </span>
                        )}
                      </div>

                      {isUploaded && asset.secure_url ? (
                        <div className="space-y-2">
                          <div className="aspect-video bg-surface rounded-lg overflow-hidden border border-border">
                            <img
                              src={asset.secure_url}
                              alt={creativeId}
                              className="w-full h-full object-contain"
                            />
                          </div>
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-text-tertiary">{asset.filename}</span>
                            <a
                              href={asset.secure_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-primary-400 hover:text-primary-300"
                            >
                              View Full Size
                            </a>
                          </div>
                        </div>
                      ) : isPlaceholder ? (
                        <div className="bg-surface-elevated border border-border rounded-lg p-4 text-center">
                          <p className="text-text-tertiary text-sm">
                            Placeholder only - upload real image for visual analysis
                          </p>
                        </div>
                      ) : cloudinaryConfigured ? (
                        <CloudinaryUploader
                          analysisId={analysisId}
                          creativeId={creativeId}
                          onSuccess={(data) => handleUploadSuccess(creativeId, data)}
                          onError={(err) => handleUploadError(creativeId, err)}
                          disabled={!cloudinaryConfigured}
                        />
                      ) : (
                        <div className="bg-warning-600/10 border border-warning-600/30 rounded-lg p-4">
                          <div className="flex items-start space-x-2">
                            <AlertTriangle className="w-4 h-4 text-warning-400 flex-shrink-0 mt-0.5" />
                            <p className="text-warning-400 text-sm">
                              Configure Cloudinary to enable uploads
                            </p>
                          </div>
                        </div>
                      )}

                      {uploadError && (
                        <div className="mt-2 bg-danger-600/10 border border-danger-600/30 rounded-lg p-3">
                          <div className="flex items-start space-x-2">
                            <XCircle className="w-4 h-4 text-danger-400 flex-shrink-0 mt-0.5" />
                            <p className="text-danger-400 text-sm">{uploadError}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              )
            })}
          </div>
        )}

        {/* Continue Button */}
        {!loading && creativeIds.length > 0 && (
          <Card className="mt-6">
            {isRunning ? (
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <div className="inline-block animate-spin rounded-full h-5 w-5 border-b-2 border-primary-500"></div>
                  <div>
                    <p className="text-text-primary font-medium">Running Analysis</p>
                    <p className="text-text-secondary text-sm">{currentStage}</p>
                  </div>
                </div>
                <div className="w-full bg-surface-elevated rounded-full h-2 overflow-hidden">
                  <div className="bg-primary-500 h-full rounded-full animate-pulse" style={{ width: '60%' }}></div>
                </div>
              </div>
            ) : runError ? (
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <XCircle className="w-5 h-5 text-danger-400 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-danger-400 font-medium">Analysis Failed</p>
                    <p className="text-text-secondary text-sm mt-1">{runError}</p>
                  </div>
                </div>
                <Button
                  onClick={handleContinue}
                  variant="primary"
                >
                  Retry
                </Button>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-text-primary font-medium">
                    {stats.uploaded > 0
                      ? `${stats.uploaded} of ${stats.total} assets uploaded`
                      : 'No assets uploaded yet'}
                  </p>
                  <p className="text-text-secondary text-sm mt-1">
                    {stats.uploaded === 0
                      ? 'You can proceed without images - analysis will compute performance metrics only'
                      : stats.remaining > 0
                      ? 'Continue uploading or proceed to run the analysis'
                      : 'All assets uploaded! Ready to run analysis.'}
                  </p>
                </div>
                <Button
                  onClick={handleContinue}
                  disabled={isRunning}
                >
                  {stats.uploaded > 0 ? 'Run Analysis' : 'Continue Without Images'}
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            )}
          </Card>
        )}
      </div>
    </DashboardLayout>
  )
}
