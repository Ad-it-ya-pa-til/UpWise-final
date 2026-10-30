import { useTranslation } from 'react-i18next'
import React, { useState, useEffect } from 'react'
import {
  X,
  Award,
  Ticket,
  Copy,
  Check,
  Clock,
  Sparkles,
  ShoppingBag,
  ExternalLink,
  AlertCircle,
  CheckCircle2,
  Gift,
} from 'lucide-react'
import {
  ClientCoupon,
  ClientCouponRedemption,
  ClientBalanceInfo,
  fetchBalanceApi,
  fetchCouponsApi,
  fetchMyCouponsApi,
  redeemCouponApi,
  markCouponUsedApi,
} from '../../services/learningApi'

export interface RewardsModalProps {
  isOpen: boolean
  onClose: () => void
  onBalanceUpdated?: (newBalance: number) => void
  initialTab?: 'store' | 'my-coupons'
}

export const RewardsModal: React.FC<RewardsModalProps> = ({
  isOpen,
  onClose,
  onBalanceUpdated,
  initialTab = 'store',
}) => {
  const { t } = useTranslation()
  const [activeTab, setActiveTab] = useState<'store' | 'my-coupons'>(initialTab)
  const [balance, setBalance] = useState<ClientBalanceInfo>({
    availableBalance: 0,
    totalEarned: 0,
    totalSpent: 0,
    transactions: [],
  })
  const [coupons, setCoupons] = useState<ClientCoupon[]>([])
  const [myCoupons, setMyCoupons] = useState<ClientCouponRedemption[]>([])
  const [loading, setLoading] = useState(false)
  const [redeemingId, setRedeemingId] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const [actionSuccess, setActionSuccess] = useState<string | null>(null)
  const [copiedCode, setCopiedCode] = useState<string | null>(null)

  useEffect(() => {
    setActiveTab(initialTab)
  }, [initialTab])

  const loadData = async () => {
    setLoading(true)
    try {
      const [bal, catalog, redeemed] = await Promise.all([
        fetchBalanceApi(),
        fetchCouponsApi(),
        fetchMyCouponsApi(),
      ])
      setBalance(bal)
      setCoupons(catalog)
      setMyCoupons(redeemed)
      onBalanceUpdated?.(bal.availableBalance)
    } catch {
      // Graceful load
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (isOpen) {
      loadData()
      setActionError(null)
      setActionSuccess(null)
    }
  }, [isOpen])

  if (!isOpen) return null

  const handleRedeem = async (coupon: ClientCoupon) => {
    if (balance.availableBalance < coupon.pointsCost) {
      setActionError(`You need ${coupon.pointsCost - balance.availableBalance} more UP Points to redeem this reward.`)
      return
    }

    setRedeemingId(coupon.id)
    setActionError(null)
    setActionSuccess(null)

    const res = await redeemCouponApi(coupon.id)
    setRedeemingId(null)

    if (res.success && res.redemption) {
      setActionSuccess(`✦ Unlocked ${coupon.title}! Code: ${res.redemption.couponCode}`)
      if (typeof res.newBalance === 'number') {
        setBalance((prev) => ({
          ...prev,
          availableBalance: res.newBalance!,
          totalSpent: prev.totalSpent + coupon.pointsCost,
        }))
        onBalanceUpdated?.(res.newBalance)
      }
      const updatedCoupons = await fetchMyCouponsApi()
      setMyCoupons(updatedCoupons)
      setActiveTab('my-coupons')
    } else {
      setActionError(res.error || 'Failed to redeem reward. Please check your points balance.')
    }
  }

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code)
    setCopiedCode(code)
    setTimeout(() => {
      setCopiedCode(null)
    }, 2500)
  }

  const handleMarkAsUsed = async (redemptionId: string) => {
    const success = await markCouponUsedApi(redemptionId)
    if (success) {
      setMyCoupons((prev) =>
        prev.map((c) => (c.id === redemptionId ? { ...c, status: 'used', usedAt: new Date().toISOString() } : c))
      )
    }
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="relative w-full max-w-3xl bg-[#FAF7F2] rounded-xl border border-[#E8E2D8] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header Bar */}
        <div className="px-6 py-5 border-b border-[#E8E2D8] bg-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#0F392B] text-white flex items-center justify-center shadow-xs">
              <Gift className="w-5 h-5 stroke-[2]" />
            </div>
            <div>
              <h2 className="font-serif text-xl sm:text-2xl font-bold text-[#141412] leading-tight">
                UP Rewards & Coupon Store
              </h2>
              <p className="text-xs text-[#78716C] mt-0.5">
                Redeem your editorial current affairs knowledge points for student & book perks.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#78716C] hover:text-[#141412] hover:bg-[#FAF7F2] transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Ledger Balance Highlights Banner */}
        <div className="px-6 py-4 bg-[#F2EDE4]/70 border-b border-[#E8E2D8] flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#0F392B] text-white text-sm font-bold shadow-xs">
              <Sparkles className="w-4 h-4 text-[#D95D39] fill-[#D95D39]" />
              <span>{balance.availableBalance} UP Points</span>
            </span>
            <span className="text-xs text-[#55504A]">Available Balance</span>
          </div>

          <div className="flex items-center gap-4 text-xs text-[#6E6860]">
            <div>
              <span className="text-[#78716C]">Total Earned: </span>
              <span className="font-semibold text-[#141412]">{balance.totalEarned} UP</span>
            </div>
            <div className="w-1 h-1 rounded-full bg-[#D4CBBF]" />
            <div>
              <span className="text-[#78716C]">Total Spent: </span>
              <span className="font-semibold text-[#141412]">{balance.totalSpent} UP</span>
            </div>
          </div>
        </div>

        {/* Notice Alerts */}
        {actionError && (
          <div className="mx-6 mt-4 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{actionError}</span>
          </div>
        )}
        {actionSuccess && (
          <div className="mx-6 mt-4 p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
            <span>{actionSuccess}</span>
          </div>
        )}

        {/* Segmented Tab Navigation */}
        <div className="px-6 pt-4 border-b border-[#E8E2D8] bg-[#FAF7F2] flex gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('store')}
            className={`pb-3 px-3 text-xs sm:text-sm font-semibold transition-colors relative flex items-center gap-2 ${activeTab === 'store'
                ? 'text-[#0F392B] border-b-2 border-[#0F392B]'
                : 'text-[#78716C] hover:text-[#141412]'
              }`}
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Redeem Rewards ({coupons.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('my-coupons')}
            className={`pb-3 px-3 text-xs sm:text-sm font-semibold transition-colors relative flex items-center gap-2 ${activeTab === 'my-coupons'
                ? 'text-[#0F392B] border-b-2 border-[#0F392B]'
                : 'text-[#78716C] hover:text-[#141412]'
              }`}
          >
            <Ticket className="w-4 h-4" />
            <span>{t('rewards.myCoupons', 'My Coupons')}</span>
            {myCoupons.length > 0 && (
              <span className="ml-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-[#D95D39] text-white">
                {myCoupons.length}
              </span>
            )}
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 bg-[#FAF7F2]">
          {/* TAB 1: STORE */}
          {activeTab === 'store' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {coupons.map((coupon) => {
                  const canAfford = balance.availableBalance >= coupon.pointsCost
                  const isRedeeming = redeemingId === coupon.id

                  return (
                    <div
                      key={coupon.id}
                      className="bg-white border border-[#E8E2D8] rounded-xl p-5 shadow-xs flex flex-col justify-between hover:border-[#D4CBBF] transition-all"
                    >
                      <div>
                        <div className="flex items-start justify-between gap-2">
                          <span className="text-[10px] uppercase font-bold tracking-wider text-[#D95D39] bg-[#FFF2ED] px-2 py-0.5 rounded">
                            {coupon.brand}
                          </span>
                          <span className="inline-flex items-center gap-1 text-xs font-bold text-[#0F392B] bg-[#E8F3EE] px-2 py-0.5 rounded-full">
                            <Sparkles className="w-3 h-3 text-[#D95D39]" />
                            {coupon.pointsCost} UP
                          </span>
                        </div>

                        <h3 className="font-serif text-lg font-bold text-[#141412] mt-2.5 leading-snug">
                          {coupon.title}
                        </h3>

                        <p className="text-xs text-[#55504A] mt-1.5 leading-relaxed">
                          {coupon.description}
                        </p>

                        <div className="mt-3 pt-3 border-t border-[#F2EDE4] flex items-center justify-between text-[11px] text-[#78716C]">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            Valid for {coupon.validityDays} days
                          </span>
                          <span className="font-semibold text-[#0F392B]">{coupon.discountText}</span>
                        </div>
                      </div>

                      <div className="mt-4 pt-2">
                        <button
                          type="button"
                          onClick={() => handleRedeem(coupon)}
                          disabled={!canAfford || isRedeeming}
                          title={!canAfford ? `Requires ${coupon.pointsCost} UP Points (You have ${balance.availableBalance})` : 'Redeem this coupon'}
                          className={`w-full py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all shadow-xs ${canAfford
                              ? 'bg-[#0F392B] text-white hover:bg-[#184837] active:scale-[0.98]'
                              : 'bg-[#E8E2D8] text-[#8C827A] cursor-not-allowed'
                            }`}
                        >
                          {isRedeeming ? (
                            <span>Unlocking Code...</span>
                          ) : canAfford ? (
                            <>
                              <span>Redeem for {coupon.pointsCost} UP</span>
                            </>
                          ) : (
                            <>
                              <span>Needs {coupon.pointsCost - balance.availableBalance} more UP</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* TAB 2: MY COUPONS */}
          {activeTab === 'my-coupons' && (
            <div>
              {myCoupons.length === 0 ? (
                <div className="text-center py-12 px-4 bg-white rounded-xl border border-dashed border-[#D4CBBF]">
                  <div className="w-12 h-12 rounded-full bg-[#FAF7F2] text-[#78716C] flex items-center justify-center mx-auto mb-3">
                    <Ticket className="w-6 h-6 stroke-[1.5]" />
                  </div>
                  <h3 className="font-serif text-lg font-bold text-[#141412]">No Redeemed Coupons Yet</h3>
                  <p className="text-xs text-[#78716C] max-w-sm mx-auto mt-1">
                    Complete news quizzes to earn UP Points and unlock student discounts on books, mock tests, and research notebooks.
                  </p>
                  <button
                    type="button"
                    onClick={() => setActiveTab('store')}
                    className="mt-4 px-4 py-2 bg-[#0F392B] text-white text-xs font-semibold rounded-lg hover:bg-[#184837] transition-all shadow-xs"
                  >
                    Browse Reward Catalog
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {myCoupons.map((item) => {
                    const isCopied = copiedCode === item.couponCode
                    const isAvailable = item.status === 'available'
                    const isUsed = item.status === 'used'
                    const isExpired = item.status === 'expired'

                    const expiryDate = new Date(item.expiresAt)
                    const daysLeft = Math.max(0, Math.ceil((expiryDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)))

                    return (
                      <div
                        key={item.id}
                        className={`bg-white border rounded-xl p-4 sm:p-5 shadow-xs transition-all ${isUsed ? 'border-[#E8E2D8] opacity-75 bg-[#FAF7F2]/50' : 'border-[#D4CBBF]'
                          }`}
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] font-bold uppercase tracking-wider text-[#78716C]">
                                {item.coupon?.brand || 'UpWise Partner'}
                              </span>
                              <span
                                className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${isAvailable
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : isUsed
                                      ? 'bg-gray-100 text-gray-700'
                                      : 'bg-rose-100 text-rose-800'
                                  }`}
                              >
                                {isAvailable ? 'Available' : isUsed ? 'Used' : 'Expired'}
                              </span>
                            </div>

                            <h4 className="font-serif text-base sm:text-lg font-bold text-[#141412] mt-1">
                              {item.coupon?.title || 'Academic Discount Reward'}
                            </h4>

                            <div className="mt-1 flex items-center gap-3 text-xs text-[#78716C]">
                              <span>Redeemed for {item.pointsSpent} UP</span>
                              <span>•</span>
                              <span>
                                {isAvailable
                                  ? `${daysLeft} days remaining (expires ${expiryDate.toLocaleDateString()})`
                                  : isUsed
                                    ? `Marked as used`
                                    : `Expired`}
                              </span>
                            </div>
                          </div>

                          {/* Coupon Code Pill & Copy Action */}
                          <div className="flex items-center gap-2 self-start sm:self-center">
                            <div className="font-mono text-xs sm:text-sm font-bold bg-[#FAF7F2] border border-[#E8E2D8] px-3 py-1.5 rounded-lg text-[#141412] tracking-wider select-all">
                              {item.couponCode}
                            </div>
                            <button
                              type="button"
                              onClick={() => handleCopyCode(item.couponCode)}
                              className={`p-2 rounded-lg border text-xs font-semibold flex items-center gap-1 transition-all ${isCopied
                                  ? 'bg-emerald-600 text-white border-emerald-600'
                                  : 'bg-white text-[#141412] border-[#E8E2D8] hover:bg-[#FAF7F2]'
                                }`}
                              title="Copy code to clipboard"
                            >
                              {isCopied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                              <span className="hidden sm:inline">{isCopied ? 'Copied' : 'Copy'}</span>
                            </button>

                            {isAvailable && (
                              <button
                                type="button"
                                onClick={() => handleMarkAsUsed(item.id)}
                                className="px-2.5 py-1.5 text-xs font-medium text-[#78716C] hover:text-[#141412] hover:bg-[#F2EDE4] rounded-lg transition-colors"
                              >
                                Mark Used
                              </button>
                            )}
                          </div>
                        </div>

                        {item.coupon?.terms && (
                          <div className="mt-3 pt-2 border-t border-[#F2EDE4] text-[11px] text-[#78716C]">
                            <span className="font-semibold text-[#55504A]">Terms: </span>
                            {item.coupon.terms}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-white border-t border-[#E8E2D8] flex items-center justify-between text-xs text-[#78716C]">
          <span>Source-grounded current affairs learning rewards.</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg font-semibold bg-[#FAF7F2] hover:bg-[#E8E2D8] text-[#141412] transition-colors border border-[#E8E2D8]"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}

