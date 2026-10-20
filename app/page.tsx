'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { BookOpen, Users, Award, Smartphone, Monitor, Globe, Menu, X, LogOut, LayoutDashboard } from 'lucide-react'
import Link from 'next/link'
import toast from 'react-hot-toast'
import LanguageSwitcher, { VersionBadge } from '@/components/i18n/LanguageSwitcher'
import { useI18n } from '@/components/i18n/LanguageProvider'
import ThemeToggle from '@/components/theme/ThemeToggle'
import { useAuthStore } from '@/lib/stores/authStore'
import { roleDashboardPath } from '@/lib/format'

export default function HomePage() {
  const { t } = useI18n()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const logout = useAuthStore((s) => s.logout)
  const currentUser = useAuthStore((s) => s.currentUser)
  const isReady = useAuthStore((s) => s.isReady)

  const handleLogout = async () => {
    await logout()
    setMobileMenuOpen(false)
    toast.success(t('common.loggedOut'))
  }

  const dashboardPath = currentUser ? roleDashboardPath(currentUser.role) : '/login'

  const features = [
    {
      icon: BookOpen,
      title: t('landing.featureCourse'),
      description: t('landing.featureCourseBody')
    },
    {
      icon: Users,
      title: t('landing.featureInteract'),
      description: t('landing.featureInteractBody')
    },
    {
      icon: Award,
      title: t('landing.featureProgress'),
      description: t('landing.featureProgressBody')
    }
  ]

  const responsiveFeatures = [
    {
      icon: Smartphone,
      title: t('landing.mobileTitle'),
      description: t('landing.mobileBody')
    },
    {
      icon: Monitor,
      title: t('landing.desktopTitle'),
      description: t('landing.desktopBody')
    },
    {
      icon: Globe,
      title: t('landing.responsiveCard'),
      description: t('landing.responsiveCardBody')
    }
  ]

  return (
    <div id="landing" className="min-h-screen w-full max-w-[100vw] overflow-x-clip bg-gradient-to-br from-primary-50 to-secondary-50">
      <header id="landing-header" className="sticky top-0 z-30 bg-white shadow-sm">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-14 items-center justify-between sm:h-16">
            <Link id="landing-logo" href="/" className="flex items-center">
              <BookOpen className="h-7 w-7 text-primary-600 sm:h-8 sm:w-8" />
              <span className="ml-2 text-lg font-bold text-gray-900 sm:text-xl">EduFlow</span>
              <VersionBadge className="ml-2" />
            </Link>
            <nav id="landing-nav" className="hidden items-center gap-6 md:flex">
              <a id="landing-nav-features" href="#features" className="text-sm text-gray-600 hover:text-primary-600">{t('nav.features')}</a>
              <a id="landing-nav-responsive" href="#responsive" className="text-sm text-gray-600 hover:text-primary-600">{t('nav.responsive')}</a>
              {!isReady ? (
                <div className="h-9 w-40 animate-pulse rounded-lg bg-gray-100" aria-hidden />
              ) : currentUser ? (
                <>
                  <span className="text-sm text-gray-700">
                    {t('common.hello')}, <strong>{currentUser.fullName}</strong>
                    <span className="ml-1 text-gray-500">({t(`role.${currentUser.role}`)})</span>
                  </span>
                  <Link
                    id="landing-nav-dashboard"
                    href={dashboardPath}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700"
                  >
                    <LayoutDashboard className="h-4 w-4" />
                    {t('nav.dashboard')}
                  </Link>
                  <button
                    id="landing-nav-logout"
                    type="button"
                    onClick={handleLogout}
                    className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-600 hover:text-red-600"
                  >
                    <LogOut className="h-4 w-4" />
                    {t('common.logout')}
                  </button>
                </>
              ) : (
                <>
                  <Link id="landing-nav-register" href="/register" className="text-sm font-medium text-gray-600 hover:text-primary-600">
                    {t('common.register')}
                  </Link>
                  <Link
                    id="landing-nav-login"
                    href="/login"
                    className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700"
                  >
                    {t('common.login')}
                  </Link>
                </>
              )}
              <LanguageSwitcher id="landing-language" />
              <ThemeToggle id="landing-theme-toggle" />
            </nav>
            <div className="flex items-center gap-1 md:hidden">
              <button
                id="landing-menu-toggle"
                type="button"
                className="rounded-lg p-2 text-gray-600 hover:bg-gray-100"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                aria-label={t('common.menu')}
              >
                {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
              <LanguageSwitcher id="landing-language-mobile" />
              <ThemeToggle id="landing-theme-toggle-mobile" />
            </div>
          </div>
          {mobileMenuOpen && (
            <nav id="landing-nav-mobile" className="border-t py-3 md:hidden">
              <div className="flex flex-col gap-2">
                <a id="landing-nav-mobile-features" href="#features" className="rounded-lg px-3 py-2 text-gray-700 hover:bg-gray-50" onClick={() => setMobileMenuOpen(false)}>
                  {t('nav.features')}
                </a>
                <a id="landing-nav-mobile-responsive" href="#responsive" className="rounded-lg px-3 py-2 text-gray-700 hover:bg-gray-50" onClick={() => setMobileMenuOpen(false)}>
                  {t('nav.responsive')}
                </a>
                {!isReady ? (
                  <div className="mx-3 h-10 animate-pulse rounded-lg bg-gray-100" aria-hidden />
                ) : currentUser ? (
                  <>
                    <p className="px-3 py-2 text-sm text-gray-700">
                      {t('common.hello')}, <strong>{currentUser.fullName}</strong>
                      <span className="block text-xs text-gray-500">{t(`role.${currentUser.role}`)}</span>
                    </p>
                    <Link
                      id="landing-nav-mobile-dashboard"
                      href={dashboardPath}
                      className="mx-3 flex items-center justify-center gap-2 rounded-lg bg-primary-600 py-2.5 text-center text-sm font-medium text-white"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <LayoutDashboard className="h-4 w-4" />
                      {t('nav.dashboard')}
                    </Link>
                    <button
                      id="landing-nav-mobile-logout"
                      type="button"
                      onClick={handleLogout}
                      className="mx-3 flex items-center justify-center gap-2 rounded-lg border border-gray-300 py-2.5 text-sm font-medium text-gray-700"
                    >
                      <LogOut className="h-4 w-4" />
                      {t('common.logout')}
                    </button>
                  </>
                ) : (
                  <>
                    <Link id="landing-nav-mobile-register" href="/register" className="rounded-lg px-3 py-2 text-gray-700 hover:bg-gray-50" onClick={() => setMobileMenuOpen(false)}>
                      {t('common.register')}
                    </Link>
                    <Link
                      id="landing-nav-mobile-login"
                      href="/login"
                      className="mx-3 rounded-lg bg-primary-600 py-2.5 text-center text-sm font-medium text-white"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      {t('common.login')}
                    </Link>
                  </>
                )}
              </div>
            </nav>
          )}
        </div>
      </header>

      {/* Hero Section */}
      <section id="landing-hero" className="px-4 py-12 sm:px-6 sm:py-16 lg:px-8 lg:py-20">
        <div className="mx-auto max-w-7xl text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h1 className="mb-4 text-3xl font-bold text-gray-900 sm:mb-6 sm:text-4xl md:text-5xl lg:text-6xl">
              {t('landing.heroTitle')}
              <span className="text-primary-600"> {t('landing.heroAccent')}</span>
            </h1>
            <p className="mx-auto mb-6 max-w-3xl text-base text-gray-600 sm:mb-8 sm:text-lg md:text-xl">
              {t('landing.heroBody')}
            </p>
          </motion.div>

          {/* CTA Buttons */}
          <motion.div
            id="landing-cta"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            {isReady && currentUser ? (
              <Link
                id="landing-cta-dashboard"
                href={dashboardPath}
                className="w-full rounded-lg bg-primary-600 px-6 py-3.5 text-center text-base font-semibold text-white hover:bg-primary-700 sm:w-auto sm:px-8 sm:py-4 sm:text-lg"
              >
                {t('landing.enterDashboard')}
              </Link>
            ) : isReady ? (
              <>
                <Link
                  id="landing-cta-login"
                  href="/login"
                  className="w-full rounded-lg bg-primary-600 px-6 py-3.5 text-center text-base font-semibold text-white hover:bg-primary-700 sm:w-auto sm:px-8 sm:py-4 sm:text-lg"
                >
                  {t('common.login')}
                </Link>
                <Link
                  id="landing-cta-register"
                  href="/register"
                  className="w-full rounded-lg border-2 border-primary-600 px-6 py-3.5 text-center text-base font-semibold text-primary-600 hover:bg-primary-50 sm:w-auto sm:px-8 sm:py-4 sm:text-lg"
                >
                  {t('landing.createAccount')}
                </Link>
              </>
            ) : (
              <div className="mx-auto h-12 w-56 animate-pulse rounded-lg bg-gray-200" aria-hidden />
            )}
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              {t('landing.featuresTitle')}
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              {t('landing.featuresBody')}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="text-center p-6 rounded-xl hover:shadow-lg transition-shadow"
              >
                <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-100 rounded-full mb-4">
                  <feature.icon className="w-8 h-8 text-primary-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-600">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Responsive Design Section */}
      <section id="responsive" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              {t('landing.responsiveTitle')}
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              {t('landing.responsiveBody')}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {responsiveFeatures.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="inline-flex items-center justify-center w-16 h-16 bg-secondary-100 rounded-full mb-4">
                  <feature.icon className="w-8 h-8 text-secondary-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-600">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center mb-4">
                <BookOpen className="h-8 w-8 text-primary-400" />
                <span className="ml-2 text-xl font-bold">EduFlow</span>
              </div>
              <p className="text-gray-400">
                {t('landing.footerBody')}
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">{t('landing.product')}</h3>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white">{t('nav.features')}</a></li>
                <li><a href="#" className="hover:text-white">{t('landing.pricing')}</a></li>
                <li><a href="#" className="hover:text-white">{t('landing.demo')}</a></li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">{t('landing.support')}</h3>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white">{t('landing.helpCenter')}</a></li>
                <li><a href="#" className="hover:text-white">{t('landing.contact')}</a></li>
                <li><a href="#" className="hover:text-white">FAQ</a></li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">{t('landing.company')}</h3>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white">{t('landing.about')}</a></li>
                <li><a href="#" className="hover:text-white">Blog</a></li>
                <li><a href="#" className="hover:text-white">{t('landing.careers')}</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>{t('landing.rights')}</p>
          </div>
        </div>
      </footer>
    </div>
  )
}

