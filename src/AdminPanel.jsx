import React, { useState, useEffect } from 'react';
import { AnimatePresence } from 'framer-motion';
import toast, { Toaster } from 'react-hot-toast';
import axios from 'axios';
import emailjs from '@emailjs/browser';
import logo from './assets/Logo.png';
import corsProxy from './services/corsProxy';

const BACKEND_URL = 'https://gokrixo.onrender.com';

const AdminPanel = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loginForm, setLoginForm] = useState({ username: '', password: '' });
  const [activeTab, setActiveTab] = useState('commands');
  const [commands, setCommands] = useState([]);
  const [workers, setWorkers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [usingProxy, setUsingProxy] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      fetchData();
    } else {
      setInitialLoading(false);
    }
  }, [isAuthenticated]);

  const fetchData = async () => {
    setInitialLoading(true);
    try {
      console.log('Fetching data from admin panel using axios...');
      
      // Try direct connection first
      let commandsData = [], workersData = [];
      
      try {
        console.log('Trying direct connection for commands...');
        const commandsResponse = await axios.get(`${BACKEND_URL}/GetCommands`, {
          timeout: 10000
        });
        commandsData = commandsResponse.data || [];
        console.log('Direct commands fetch successful');
      } catch (directError) {
        console.log('Direct commands fetch failed, trying CORS proxy...', directError);
        try {
          const proxyResponse = await corsProxy.getCommands();
          commandsData = proxyResponse.data || [];
          setUsingProxy(true);
          toast.success('تم الاتصال عبر الخادم الوسيط للطلبات');
          console.log('CORS proxy commands fetch successful');
        } catch (proxyError) {
          console.error('CORS proxy also failed:', proxyError);
          toast.error('فشل في تحميل الطلبات: ' + (proxyError.message || 'خطأ غير معروف'));
        }
      }
      
      try {
        console.log('Trying direct connection for workers...');
        const workersResponse = await axios.get(`${BACKEND_URL}/GetWorkers`, {
          timeout: 10000
        });
        workersData = workersResponse.data || [];
        console.log('Direct workers fetch successful');
      } catch (directError) {
        console.log('Direct workers fetch failed, trying CORS proxy...', directError);
        try {
          const proxyResponse = await corsProxy.getWorkers();
          workersData = proxyResponse.data || [];
          setUsingProxy(true);
          toast.success('تم الاتصال عبر الخادم الوسيط للعمال');
          console.log('CORS proxy workers fetch successful');
        } catch (proxyError) {
          console.error('CORS proxy also failed:', proxyError);
          toast.error('فشل في تحميل العمال: ' + (proxyError.message || 'خطأ غير معروف'));
        }
      }
      
      setCommands(commandsData);
      setWorkers(workersData);
      
      console.log('Final data - Commands:', commandsData);
      console.log('Final data - Workers:', workersData);
      
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('فشل في تحميل البيانات: ' + (error.message || 'خطأ غير معروف'));
    } finally {
      setInitialLoading(false);
    }
  };

  const handleLogin = (e) => {
    e.preventDefault();
    if (loginForm.username === 'admin' && loginForm.password === 'password') {
      setIsAuthenticated(true);
      toast.success('تم تسجيل الدخول بنجاح');
    } else {
      toast.error('اسم المستخدم أو كلمة المرور غير صحيحة');
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setLoginForm({ username: '', password: '' });
    toast.success('تم تسجيل الخروج بنجاح');
  };

  // API call functions
  const approveCommand = async (commandId) => {
    setLoading(true);
    try {
      console.log('Approving command:', commandId);
      
      await axios.put(`${BACKEND_URL}/UpdateCommandStatus`, { 
        commandId, 
        status: 'approved' 
      });
      
      console.log('Command approval successful');
      
      // Update local state
      setCommands(prev => prev.map(cmd => 
        cmd.id === commandId ? { ...cmd, status: 'approved' } : cmd
      ));

      // Send approval email
      const command = commands.find(cmd => cmd.id === commandId);
      await sendCommandEmail(command, 'approved');
      
      toast.success('تم قبول الطلب وإرسال إيميل للعميل');
    } catch (error) {
      console.error('Error approving command:', error);
      toast.error(error.response?.data?.message || error.message || 'حدث خطأ أثناء قبول الطلب');
    } finally {
      setLoading(false);
    }
  };

  const rejectCommand = async (commandId) => {
    setLoading(true);
    try {
      console.log('Rejecting command:', commandId);
      
      await axios.put(`${BACKEND_URL}/UpdateCommandStatus`, { 
        commandId, 
        status: 'rejected' 
      });
      
      console.log('Command rejection successful');
      
      // Update local state
      setCommands(prev => prev.map(cmd => 
        cmd.id === commandId ? { ...cmd, status: 'rejected' } : cmd
      ));

      // Send rejection email
      const command = commands.find(cmd => cmd.id === commandId);
      await sendCommandEmail(command, 'rejected');
      
      toast.success('تم رفض الطلب وإرسال إيميل للعميل');
    } catch (error) {
      console.error('Error rejecting command:', error);
      toast.error(error.response?.data?.message || error.message || 'حدث خطأ أثناء رفض الطلب');
    } finally {
      setLoading(false);
    }
  };

  const approveWorker = async (workerId, password) => {
    setLoading(true);
    try {
      console.log('Approving worker:', workerId);
      
      await axios.put(`${BACKEND_URL}/UpdateWorkerStatus`, { 
        workerId, 
        status: 'approved', 
        password 
      });
      
      console.log('Worker approval successful');
      
      // Update local state
      setWorkers(prev => prev.map(worker => 
        worker.id === workerId ? { ...worker, isAccepted: true, password: password } : worker
      ));
      
      toast.success('تم قبول العامل بنجاح');
    } catch (error) {
      console.error('Error approving worker:', error);
      toast.error(error.response?.data?.message || error.message || 'حدث خطأ أثناء قبول العامل');
    } finally {
      setLoading(false);
    }
  };

  const rejectWorker = async (workerId) => {
    setLoading(true);
    try {
      console.log('Rejecting worker:', workerId);
      
      await axios.put(`${BACKEND_URL}/UpdateWorkerStatus`, { 
        workerId, 
        status: 'rejected' 
      });
      
      console.log('Worker rejection successful');
      
      // Update local state
      setWorkers(prev => prev.map(worker => 
        worker.id === workerId ? { ...worker, isAccepted: false } : worker
      ));
      
      toast.success('تم رفض العامل');
    } catch (error) {
      console.error('Error rejecting worker:', error);
      toast.error(error.response?.data?.message || error.message || 'حدث خطأ أثناء رفض العامل');
    } finally {
      setLoading(false);
    }
  };

  const sendCommandEmail = async (command, status) => {
    try {
      const templateParams = {
        to_name: command.name,
        to_email: command.email || 'customer@example.com', // You might need to add email to command form
        command_id: command.id,
        status: status === 'approved' ? 'مقبول' : 'مرفوض',
        services: command.services.join(', '),
        price: command.price,
        message: status === 'approved' 
          ? 'تم قبول طلبك وسيتم التواصل معك قريباً لتحديد موعد الخدمة.'
          : 'نعتذر، لم نتمكن من قبول طلبك في الوقت الحالي. يرجى المحاولة مرة أخرى لاحقاً.'
      };

      await emailjs.send(
        'service_w2rjkio',
        'template_command_status', // You'll need to create this template
        templateParams,
        'u78EYyDgHj3kkBcVv'
      );
    } catch (error) {
      console.error('Error sending email:', error);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 flex items-center justify-center p-4">
        <Toaster position="top-center" />
        <div
          className="bg-white rounded-xl shadow-2xl p-8 w-full max-w-md"
        >
          <div className="text-center mb-8">
            <img src={logo} alt="KRIXO" className="w-16 h-16 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-800 mb-2">لوحة التحكم</h1>
            <p className="text-gray-600">تسجيل دخول المدير</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6" dir="rtl">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                اسم المستخدم
              </label>
              <input
                type="text"
                value={loginForm.username}
                onChange={(e) => setLoginForm(prev => ({ ...prev, username: e.target.value }))}
                className="w-full px-4 text-black placeholder:text-gray-50 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="أدخل اسم المستخدم"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                كلمة المرور
              </label>
              <input
                type="password"
                value={loginForm.password}
                onChange={(e) => setLoginForm(prev => ({ ...prev, password: e.target.value }))}
                className="w-full text-black px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="أدخل كلمة المرور"
                required
              />
            </div>

            <button
              type="submit"
              className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              تسجيل الدخول
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
      <Toaster position="top-center" />
      
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-4">
              <img src={logo} alt="KRIXO" className="w-10 h-10" />
              <h1 className="text-xl font-bold text-gray-900">لوحة التحكم - KRIXO</h1>
              {usingProxy && (
                <span className="bg-orange-100 text-orange-800 px-2 py-1 rounded-full text-xs font-medium">
                  خادم وسيط
                </span>
              )}
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={fetchData}
                disabled={initialLoading}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {initialLoading ? 'جاري التحميل...' : 'تحديث البيانات'}
              </button>
              <button
                onClick={handleLogout}
                className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
              >
                تسجيل الخروج
              </button>
            </div>
          </div>
        </div>
      </header>

      {/*  Tabs */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8 space-x-reverse">
            <button
              onClick={() => setActiveTab('commands')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'commands'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              الطلبات ({commands.filter(cmd => cmd.status === 'pending').length})
            </button>
            <button
              onClick={() => setActiveTab('workers')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'workers'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              طلبات التوظيف ({workers.filter(worker => worker.isAccepted === null).length})
            </button>
          </nav>
        </div>
      </div>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {initialLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">جاري تحميل البيانات...</p>
            </div>
          </div>
        ) : (
          <AnimatePresence mode="wait">
            {activeTab === 'commands' && (
              <CommandsTab
                commands={commands}
                onApprove={approveCommand}
                onReject={rejectCommand}
                loading={loading}
              />
            )}
            {activeTab === 'workers' && (
              <WorkersTab
                workers={workers}
                onApprove={approveWorker}
                onReject={rejectWorker}
                loading={loading}
              />
            )}
          </AnimatePresence>
        )}
      </main>
    </div>
  );
};

// Commands Tab Component
const CommandsTab = ({ commands, onApprove, onReject, loading }) => {
  if (!commands || commands.length === 0) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-gray-900">إدارة الطلبات</h2>
        <div className="bg-white rounded-lg shadow-md p-8 border text-center">
          <p className="text-gray-600 text-lg">لا توجد طلبات حالياً</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">إدارة الطلبات ({commands.length})</h2>
      
      <div className="grid gap-6">
        {commands.map((command) => (
          <div key={command.id} className="bg-white rounded-lg shadow-md p-6 border">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{command.name}</h3>
                <p className="text-gray-600">{command.phone}</p>
                {command.email && <p className="text-gray-600">{command.email}</p>}
              </div>
              <div className="flex items-center gap-2">
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  command.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                  command.status === 'approved' ? 'bg-green-100 text-green-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {command.status === 'pending' ? 'في الانتظار' :
                   command.status === 'approved' ? 'مقبول' : 'مرفوض'}
                </span>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4 mb-4">
              <div>
                <p className="text-sm text-gray-600">الخدمات:</p>
                <p className="font-medium text-blue-900 text-lg">
                  {Array.isArray(command.services) ? command.services.join(', ') : command.services}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">السعر:</p>
                <p className="font-medium text-blue-900 text-lg text-blue-600">{command.price} دج</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">من:</p>
                <p className="font-medium text-blue-900 text-lg">{command.start}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">إلى:</p>
                <p className="font-medium text-blue-900 text-lg">{command.end}</p>
              </div>
            </div>

            {command.status === 'pending' && (
              <div className="flex gap-3">
                <button
                  onClick={() => onApprove(command.id)}
                  disabled={loading}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                >
                  {loading ? 'جاري...' : 'قبول'}
                </button>
                <button
                  onClick={() => onReject(command.id)}
                  disabled={loading}
                  className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                >
                  {loading ? 'جاري...' : 'رفض'}
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

// Workers Tab Component
const WorkersTab = ({ workers, onApprove, onReject, loading }) => {
  const [passwords, setPasswords] = useState({});

  const handleApprove = (workerId) => {
    const password = passwords[workerId];
    if (!password) {
      toast.error('يرجى إدخال كلمة مرور للعامل');
      return;
    }
    onApprove(workerId, password);
  };

  if (!workers || workers.length === 0) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-gray-900">إدارة طلبات التوظيف</h2>
        <div className="bg-white rounded-lg shadow-md p-8 border text-center">
          <p className="text-gray-600 text-lg">لا توجد طلبات توظيف حالياً</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">إدارة طلبات التوظيف ({workers.length})</h2>
      
      <div className="grid gap-6">
        {workers.map((worker) => (
          <div key={worker.id} className="bg-white rounded-lg shadow-md p-6 border">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{worker.name}</h3>
                <p className="text-gray-600">{worker.email}</p>
                <p className="text-gray-600">{worker.phone}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  worker.isAccepted === null ? 'bg-yellow-100 text-yellow-800' :
                  worker.isAccepted ? 'bg-green-100 text-green-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {worker.isAccepted === null ? 'في الانتظار' :
                   worker.isAccepted ? 'مقبول' : 'مرفوض'}
                </span>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4 mb-4">
              <div>
                <p className="text-sm text-gray-600">المنصب:</p>
                <p className="font-medium">{worker.position}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">الخبرة:</p>
                <p className="font-medium">{worker.experience}</p>
              </div>
            </div>

            {worker.message && (
              <div className="mb-4">
                <p className="text-sm text-gray-600">الرسالة:</p>
                <p className="font-medium bg-gray-50 p-3 rounded">{worker.message}</p>
              </div>
            )}

            {worker.isAccepted === null && (
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    كلمة مرور العامل (مطلوبة للقبول)
                  </label>
                  <input
                    type="password"
                    value={passwords[worker.id] || ''}
                    onChange={(e) => setPasswords(prev => ({ ...prev, [worker.id]: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="أدخل كلمة مرور للعامل"
                  />
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => handleApprove(worker.id)}
                    disabled={loading}
                    className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                  >
                    {loading ? 'جاري...' : 'قبول'}
                  </button>
                  <button
                    onClick={() => onReject(worker.id)}
                    disabled={loading}
                    className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                  >
                    {loading ? 'جاري...' : 'رفض'}
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminPanel;