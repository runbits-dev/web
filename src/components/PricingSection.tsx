"use client"

import { useState } from 'react'
import Link from 'next/link'
import { Check, Star } from 'lucide-react'
import { useI18n } from '@/i18n'

type Tier = 'free' | 'starter' | 'growth' | 'business'
type Interval = 'monthly' | 'annual'

type Plan = {
  key: Tier
  monthly: number
  annual: number
  popular?: boolean
  featureKeys: string[]
}

const PLANS: Plan[] = [
  {
    key: 'free',
    monthly: 0,
    annual: 0,
    featureKeys: ['f1', 'f2', 'f3', 'f4', 'f5'],
  },
  {
    key: 'starter',
    monthly: 19,
    annual: 190,
    featureKeys: ['f1', 'f2', 'f3', 'f4', 'f5', 'f6', 'f7'],
  },
  {
    key: 'growth',
    monthly: 59,
    annual: 590,
    popular: true,
    featureKeys: ['f1', 'f2', 'f3', 'f4', 'f5', 'f6'],
  },
  {
    key: 'business',
    monthly: 179,
    annual: 1790,
    featureKeys: ['f1', 'f2', 'f3', 'f4', 'f5', 'f6'],
  },
]

const COMPETITORS = [
  { key: 'pedidosya', amount: '~$400' },
  { key: 'rappi', amount: '~$500' },
  { key: 'pedix', amount: '~$50' },
  { key: 'shopify', amount: '$29' },
  { key: 'runbits', amount: '$19', highlight: true },
]

export type PricingSectionProps = {
  recommendedTier?: Tier
}

export function PricingSection({ recommendedTier }: PricingSectionProps) {
  const { t } = useI18n()
  const [interval, setInterval] = useState<Interval>('monthly')

  return (
    <section id="pricing" className="py-20 sm:py-28 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 tracking-tight">
            {t('pricing.title')}
          </h2>
          <p className="mt-4 text-lg text-gray-600">
            {t('pricing.subtitle')}
          </p>
        </div>

        {/* Billing toggle */}
        <div className="flex items-center justify-center mb-12">
          <div className="inline-flex bg-gray-100 rounded-full p-1" role="tablist" aria-label={t('pricing.billingToggle')}>
            <button
              type="button"
              role="tab"
              aria-selected={interval === 'monthly'}
              onClick={() => setInterval('monthly')}
              className={`px-5 py-2 text-sm font-semibold rounded-full transition-colors ${
                interval === 'monthly'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {t('pricing.monthly')}
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={interval === 'annual'}
              onClick={() => setInterval('annual')}
              className={`px-5 py-2 text-sm font-semibold rounded-full transition-colors flex items-center gap-2 ${
                interval === 'annual'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {t('pricing.annual')}
              <span className="text-[10px] font-bold bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded">
                {t('pricing.twoMonthsFree')}
              </span>
            </button>
          </div>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5">
          {PLANS.map((plan) => {
            const isHighlighted = recommendedTier
              ? plan.key === recommendedTier
              : plan.popular
            const isFree = plan.monthly === 0

            return (
              <div
                key={plan.key}
                className={`relative rounded-2xl p-7 flex flex-col ${
                  isHighlighted
                    ? 'bg-brand-600 text-white shadow-xl shadow-brand-600/20 ring-2 ring-brand-600'
                    : 'bg-gray-50 border border-gray-100'
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-amber-400 text-amber-900 text-xs font-bold px-4 py-1 rounded-full whitespace-nowrap flex items-center gap-1">
                    <Star className="w-3 h-3" />
                    {t('pricing.popular')}
                  </div>
                )}
                {recommendedTier === plan.key && !plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-emerald-400 text-emerald-900 text-xs font-bold px-4 py-1 rounded-full whitespace-nowrap">
                    {t('pricing.recommended')}
                  </div>
                )}

                <div>
                  <h3
                    className={`text-lg font-semibold ${
                      isHighlighted ? 'text-white' : 'text-gray-900'
                    }`}
                  >
                    {t(`pricing.plans.${plan.key}.name`)}
                  </h3>
                  <p
                    className={`mt-1 text-sm ${
                      isHighlighted ? 'text-brand-100' : 'text-gray-500'
                    }`}
                  >
                    {t(`pricing.plans.${plan.key}.desc`)}
                  </p>
                </div>

                <div className="mt-6 min-h-[100px]">
                  <div className="flex items-baseline gap-1.5">
                    <span
                      className={`text-5xl font-extrabold tracking-tight transition-all duration-200 ${
                        isHighlighted ? 'text-white' : 'text-gray-900'
                      }`}
                    >
                      {isFree ? t('pricing.free') : `${t('pricing.currency')}${interval === 'annual' ? plan.annual : plan.monthly}`}
                    </span>
                    {!isFree && (
                      <span
                        className={`text-sm font-medium ${
                          isHighlighted ? 'text-brand-200' : 'text-gray-500'
                        }`}
                      >
                        {interval === 'annual' ? t('pricing.perYear') : t('pricing.perMonth')}
                      </span>
                    )}
                  </div>

                  {!isFree && interval === 'annual' && (
                    <div className="mt-2 flex items-center gap-2">
                      <span className="inline-flex text-[10px] font-bold bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded">
                        {t('pricing.save17')}
                      </span>
                      <span
                        className={`text-xs ${
                          isHighlighted ? 'text-brand-100' : 'text-gray-600'
                        }`}
                      >
                        {t('pricing.equivPerMonth')} {t('pricing.currency')}
                        {Math.floor(plan.annual / 12)}/{t('pricing.monthShort')}
                      </span>
                    </div>
                  )}
                  {!isFree && interval === 'monthly' && (
                    <p
                      className={`mt-2 text-xs ${
                        isHighlighted ? 'text-brand-200' : 'text-gray-500'
                      }`}
                    >
                      {t('pricing.billedMonthly')}
                    </p>
                  )}
                  {isFree && (
                    <p
                      className={`mt-2 text-xs ${
                        isHighlighted ? 'text-brand-200' : 'text-gray-500'
                      }`}
                    >
                      {t('pricing.freeForever')}
                    </p>
                  )}
                </div>

                <ul className="mt-6 space-y-3 flex-1">
                  {plan.featureKeys.map((fk) => (
                    <li
                      key={fk}
                      className={`flex items-start gap-3 text-sm ${
                        isHighlighted ? 'text-brand-50' : 'text-gray-700'
                      }`}
                    >
                      <Check
                        className={`w-5 h-5 shrink-0 mt-0.5 ${
                          isHighlighted ? 'text-brand-200' : 'text-brand-500'
                        }`}
                      />
                      <span>{t(`pricing.plans.${plan.key}.${fk}`)}</span>
                    </li>
                  ))}
                </ul>

                <Link
                  href={`/register?plan=${plan.key}&interval=${interval}`}
                  className={`mt-8 block w-full text-center py-3 px-6 rounded-xl font-semibold transition-colors ${
                    isHighlighted
                      ? 'bg-white text-brand-700 hover:bg-brand-50'
                      : 'border-2 border-brand-600 text-brand-700 hover:bg-brand-50'
                  }`}
                >
                  {t(`pricing.plans.${plan.key}.cta`)}
                </Link>
              </div>
            )
          })}
        </div>

        <p className="mt-10 text-center text-sm text-gray-500">
          {t('pricing.footnote1')}
          <br />
          {t('pricing.footnote2')}{' '}
          <a
            href="mailto:soporte@runbits.io"
            className="text-brand-600 hover:underline font-medium"
          >
            {t('pricing.footnoteLink')}
          </a>
        </p>

        {/* Competitor comparison */}
        <div className="mt-20 max-w-3xl mx-auto">
          <div className="text-center mb-8">
            <h3 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">
              {t('pricing.compare.title')}
            </h3>
            <p className="mt-3 text-base text-gray-600">
              {t('pricing.compare.subtitle')}
            </p>
          </div>

          {/* Desktop: table */}
          <div className="hidden sm:block bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    {t('pricing.compare.platform')}
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    {t('pricing.compare.monthlyCost')}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {COMPETITORS.map((c) => (
                  <tr
                    key={c.key}
                    className={c.highlight ? 'bg-brand-50' : 'hover:bg-gray-50'}
                  >
                    <td
                      className={`px-6 py-4 text-sm ${
                        c.highlight
                          ? 'font-bold text-brand-700'
                          : 'font-medium text-gray-900'
                      }`}
                    >
                      {t(`pricing.compare.platforms.${c.key}`)}
                    </td>
                    <td
                      className={`px-6 py-4 text-sm text-right ${
                        c.highlight
                          ? 'font-bold text-brand-700'
                          : 'text-gray-700'
                      }`}
                    >
                      {c.amount}
                      {c.highlight && (
                        <span className="ml-2 text-xs font-semibold text-brand-600">
                          {t('pricing.compare.yourPlan')}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile: cards */}
          <div className="sm:hidden space-y-3">
            {COMPETITORS.map((c) => (
              <div
                key={c.key}
                className={`flex items-center justify-between rounded-xl border p-4 ${
                  c.highlight
                    ? 'bg-brand-50 border-brand-200'
                    : 'bg-white border-gray-200'
                }`}
              >
                <span
                  className={
                    c.highlight
                      ? 'text-sm font-bold text-brand-700'
                      : 'text-sm font-medium text-gray-900'
                  }
                >
                  {t(`pricing.compare.platforms.${c.key}`)}
                </span>
                <span
                  className={
                    c.highlight
                      ? 'text-sm font-bold text-brand-700'
                      : 'text-sm text-gray-700'
                  }
                >
                  {c.amount}
                  {c.highlight && (
                    <span className="ml-1 text-[10px] font-semibold text-brand-600">
                      {t('pricing.compare.yourPlan')}
                    </span>
                  )}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

export default PricingSection
