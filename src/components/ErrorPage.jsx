import React from 'react';
import { useNavigate, useRouteError } from 'react-router-dom';
import { motion } from 'framer-motion';

const ErrorPage = () => {
  const error = useRouteError();
  const navigate = useNavigate();

  // Determine error type and message
  const getErrorInfo = () => {
    if (error?.status === 404) {
      return {
        title: 'الصفحة غير موجودة',
        subtitle: '404 - Page Not Found',
        message: 'عذراً، الصفحة التي تبحث عنها غير موجودة',
        icon: '🔍',
        color: 'blue'
      };
    }
    
    if (error?.status === 403) {
      return {
        title: 'غير مصرح بالوصول',
        subtitle: '403 - Forbidden',
        message: 'عذراً، ليس لديك صلاحية للوصول إلى هذه الصفحة',
        icon: '🚫',
        color: 'red'
      };
    }
    
    if (error?.status === 500) {
      return {
        title: 'خطأ في الخادم',
        subtitle: '500 - Server Error',
        message: 'عذراً، حدث خطأ في الخادم. يرجى المحاولة مرة أخرى لاحقاً',
        icon: '⚡',
        color: 'orange'
      };
    }
    
    if (error?.message?.includes('Network Error') || error?.message?.includes('CORS')) {
      return {
        title: 'خطأ في الاتصال',
        subtitle: 'Network Error',
        message: 'عذراً، لا يمكن الاتصال بالخادم. يرجى التحقق من اتصال الإنترنت والمحاولة مرة أخرى',
        icon: '🌐',
        color: 'purple'
      };
    }
    
    // Default error
    return {
      title: 'حدث خطأ ما',
      subtitle: 'Something went wrong',
      message: 'عذراً، حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى',
      icon: '❌',
      color: 'gray'
    };
  };

  const errorInfo = getErrorInfo();
  const colorClasses = {
    blue: 'bg-blue-50 border-blue-200 text-blue-800',
    red: 'bg-red-50 border-red-200 text-red-800',
    orange: 'bg-orange-50 border-orange-200 text-orange-800',
    purple: 'bg-purple-50 border-purple-200 text-purple-800',
    gray: 'bg-gray-50 border-gray-200 text-gray-800'
  };

  const handleGoHome = () => {
    navigate('/');
  };

  const handleGoBack = () => {
    navigate(-1);
  };

  const handleRefresh = () => {
    window.location.reload();
  };

  const handleContactSupport = () => {
    navigate('/contact');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-md w-full"
      >
        {/* Error Card */}
        <div className={`bg-white rounded-2xl shadow-2xl p-8 text-center border-2 ${colorClasses[errorInfo.color]}`}>
          {/* Error Icon */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            className="text-6xl mb-6"
          >
            {errorInfo.icon}
          </motion.div>

          {/* Error Title */}
          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-2xl font-bold mb-2 text-gray-800"
          >
            {errorInfo.title}
          </motion.h1>

          {/* Error Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-sm text-gray-600 mb-4"
          >
            {errorInfo.subtitle}
          </motion.p>

          {/* Error Message */}
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="text-gray-700 mb-8 leading-relaxed"
          >
            {errorInfo.message}
          </motion.p>

          {/* Error Details (Development only) */}
          {process.env.NODE_ENV === 'development' && error && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="mb-6 p-4 bg-gray-100 rounded-lg text-left"
            >
              <p className="text-xs text-gray-600 mb-2 font-semibold">Error Details (Development):</p>
              <pre className="text-xs text-gray-700 overflow-auto">
                {JSON.stringify(error, null, 2)}
              </pre>
            </motion.div>
          )}

          {/* Action Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="space-y-3"
          >
            {/* Primary Action */}
            <button
              onClick={handleGoHome}
              className="w-full bg-blue-500 text-white py-3 px-6 rounded-lg hover:bg-blue-600 transition-colors font-semibold"
            >
              العودة للصفحة الرئيسية
            </button>

            {/* Secondary Actions */}
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={handleGoBack}
                className="bg-gray-200 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-300 transition-colors text-sm"
              >
                رجوع
              </button>
              
              <button
                onClick={handleRefresh}
                className="bg-gray-200 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-300 transition-colors text-sm"
              >
                تحديث الصفحة
              </button>
            </div>

            {/* Contact Support */}
            <button
              onClick={handleContactSupport}
              className="w-full bg-transparent border border-gray-300 text-gray-600 py-2 px-4 rounded-lg hover:bg-gray-50 transition-colors text-sm"
            >
              التواصل مع الدعم
            </button>
          </motion.div>
        </div>

        {/* Additional Help */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="mt-6 text-center text-gray-400 text-sm"
        >
          <p>إذا استمرت المشكلة، يرجى التواصل معنا</p>
          <p className="mt-1">رقم الهاتف: +213 XXX XXX XXX</p>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default ErrorPage; 