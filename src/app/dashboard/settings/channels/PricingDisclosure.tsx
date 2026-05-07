"use client"

import { useI18n } from '@/i18n'

interface Props {
  onAccept: () => void
  onClose: () => void
}

/**
 * Pre-OAuth modal that surfaces Meta's per-conversation pricing model BEFORE
 * the merchant clicks through to Embedded Signup. This avoids surprise charges
 * post-connect.
 */
export function PricingDisclosure({ onAccept, onClose }: Props) {
  const { t } = useI18n()
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div
        className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-lg font-semibold text-slate-900 mb-2">
          {t('settingsChannels.pricingTitle')}
        </h2>

        <div className="space-y-3 text-sm text-slate-700">
          <p>{t('settingsChannels.pricingIntro')}</p>

          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
            <p className="font-medium text-amber-900 mb-1">
              {t('settingsChannels.pricingMetaCharges')}
            </p>
            <ul className="list-disc list-inside text-amber-800 space-y-1 text-xs">
              <li>{t('settingsChannels.pricingService')}</li>
              <li>{t('settingsChannels.pricingUtility')}</li>
              <li>{t('settingsChannels.pricingMarketing')}</li>
            </ul>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
            <p className="font-medium text-slate-900 mb-1">
              {t('settingsChannels.requirementsTitle')}
            </p>
            <ul className="list-disc list-inside text-slate-700 space-y-1 text-xs">
              <li>{t('settingsChannels.req2FA')}</li>
              <li>{t('settingsChannels.reqVerifiedBusiness')}</li>
              <li>{t('settingsChannels.reqOwnNumber')}</li>
            </ul>
            <a
              href="https://www.facebook.com/business/help/2086321391181876"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block mt-2 text-xs text-blue-600 underline"
            >
              {t('settingsChannels.linkPorting')} →
            </a>
          </div>
        </div>

        <div className="mt-5 flex gap-2 justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50"
          >
            {t('common.cancel')}
          </button>
          <button
            onClick={onAccept}
            className="px-4 py-2 text-sm rounded-lg bg-emerald-600 text-white font-medium hover:bg-emerald-700"
          >
            {t('settingsChannels.pricingAcceptCta')}
          </button>
        </div>
      </div>
    </div>
  )
}
