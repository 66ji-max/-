export const translations = {
  zh: {
    brand: {
      title: '鹭起南洋',
      subtitle: '扶摇直上'
    },
    nav: {
      home: '首页',
      aiSaas: 'AI SaaS软件',
      ecommerce: '跨境电商',
      logistics: '跨境物流',
      news: '资讯',
      investor: '投资者关系',
      governance: '公司治理',
      about: '关于我们',
      join: '加入我们',
      lang: '语言 | Language',
      userCenter: '个人中心',
      adminPanel: '管理后台',
      logout: '退出登录',
      loginRegister: '登录 / 注册'
    },
    auth: {
      loginTitle: '登录',
      registerTitle: '创建账户',
      email: '邮箱',
      emailOrUsername: '邮箱或用户名',
      password: '密码',
      confirmPassword: '确认密码',
      name: '姓名',
      username: '用户名',
      loginBtn: '登录',
      registerBtn: '注册',
      noAccount: '没有账号？',
      hasAccount: '已有账号？',
      loginFailed: '登录失败',
      registerFailed: '注册失败',
      emailInUse: '该邮箱已被注册',
      invalidCreds: '邮箱或密码错误',
      systemError: '系统错误，请稍后再试',
      passwordMismatch: '两次输入的密码不一致',
      weakPassword: '密码至少 8 位，且必须包含大写字母、小写字母和数字'
    },
    admin: {
      title: '系统管理后台',
      searchPlaceholder: '搜索邮箱/用户名...',
      userList: '用户列表',
      edit: '编辑',
      delete: '删除',
      cancel: '取消',
      save: '保存',
      confirmDelete: '确定要删除此用户吗？',
      cannotDeleteSelf: '不能删除自己',
      updateSuccess: '更新成功',
      updateFailed: '更新失败',
      deleteSuccess: '删除成功',
      deleteFailed: '删除失败',
      role: '角色',
      plan: '计划',
      status: '状态',
      grantVip: '设为 PRO',
      revokeVip: '取消 VIP'
    },
    dashboard: {
      title: '用户仪表盘',
      welcome: '欢迎，',
      subscriptionPlan: '订阅计划',
      accountStatus: '账号状态',
      freeTrialRemaining: '免费试用剩余：',
      logout: '退出',
      goAI: '前往 AI',
      upgradeAI: '升级 AI',
      planLabels: { free: '免费体验版', startup: '初创版', pro: '专业版', na: '暂无' },
      statusLabels: { trial: '试用中', active: '已生效', expired: '已过期', cancelled: '已取消', na: '暂无' },
      myFiles: '我的文件',
      uploadFile: '上传文件',
      noFiles: '暂无上传的文件。',
      uploadFailed: '上传失败'
    },
    hero: {
      stockCode: '深交所股票代码: 301558',
      line1: '笃信AI的无限可能，',
      line2: '矢志成为行业智能化的',
      line2_sub: '领航者和践行者',
      aiButton: '一键使用 AI SAAS',
      start: '开始'
    },
    aiSaas: {
      section1Title: '人工智能×跨境电商',
      section1Sub: '行业智能化解决方案',
      section1Desc: '鹭起南洋凭借在跨境电商领域深耕数十年的经验，沉淀除了围绕智能物流、人才管理等降本增效的人工智能应用，并在至极探索未来的全新购物方式。',
      card1Title: '鹭起智查',
      card1Desc: '跨境一站式合规检测工具',
      card2Title: 'ECI员工奋斗者指数',
      card2Desc: '通过多维人才特征，人才聚类，从而识别优秀人才',
      card3Title: '智能物流',
      card3Desc: '通过机器学习等手段，进行销量预测、供应链管理，提升效率',
      card4Title: '电商购物助理',
      card4Desc: '新一代的电商购物体验',
      
      section2Title: '人工智能×侵权雷达',
      section2Sub: '跨境电商合规工具箱',
      section2Desc: '专注于为跨境电商卖家提供一站式风险检测和专利多模态查询服务，产品主要包括商标雷达、专利雷达、平台政策雷达、法律雷达等功能。',
      btnWebsite: '鹭起智查',
      cardRadar1Title: '商标雷达',
      cardRadar1Desc: '每日更新商标数据库，AI助力判断实际风险',
      cardRadar2Title: '专利雷达',
      cardRadar2Desc: '智能匹配相似专利，风险一览无遗',
      cardRadar3Title: '图形商标雷达',
      cardRadar3Desc: '采用多模态（图文）召回策略，擅长从复杂的商品背景中准确识别商标特征。',
      cardRadar4Title: '政策雷达',
      cardRadar4Desc: '实时匹配亚马逊、eBay等平台政策，合规无忧'
    },
    pricing: {
      title: '产品定价与订阅',
      subtitle: '选择最适合您业务规模的套餐',
      free: {
        name: '免费体验',
        period: '永久',
        features: ['基础侵权词库检索 (每日10次)', '平台政策基础解读', '支持单语言界面'],
        button: '当前版本'
      },
      startup: {
        name: '初创版 / Startup',
        period: '/ 月',
        features: ['包含免费版所有功能', '多模态图形侵权检测 (每日50次)', '实时 API 接口调用 (限流)', '邮件专属客服支持'],
        button: '升级初创版',
        price: '¥ 99'
      },
      pro: {
        name: '专业版 / Pro',
        period: '/ 年',
        features: ['专属私有化模型微调', '无限制多模态检测', 'ECI分析系统完整接入', '中马双边专家合规咨询 (每月1次)', '7x24小时全天候响应'],
        button: '升级专业版',
        price: '¥ 9,999'
      }
    },
    chat: {
      welcome: '欢迎来到 AI SaaS 实验室。我是您的智能助手。关于跨境电商、智能物流或 AI SaaS，您有什么想了解的吗？',
      inputPlaceholder: '询问关于 AI 解决方案的问题...'
    }
  },
  en: {
    brand: {
      title: 'LuQi Nanyang',
      subtitle: 'Soaring Upward'
    },
    nav: {
      home: 'Home',
      aiSaas: 'AI SaaS',
      ecommerce: 'Cross-border E-com',
      logistics: 'Logistics',
      news: 'News',
      investor: 'Investors',
      governance: 'Governance',
      about: 'About Us',
      join: 'Join Us',
      lang: 'Language | 语言',
      userCenter: 'User Center',
      adminPanel: 'Admin Panel',
      logout: 'Logout',
      loginRegister: 'Login / Register'
    },
    auth: {
      loginTitle: 'Log in',
      registerTitle: 'Create Account',
      email: 'Email',
      emailOrUsername: 'Email or Username',
      password: 'Password',
      confirmPassword: 'Confirm Password',
      name: 'Name',
      username: 'Username',
      loginBtn: 'Login',
      registerBtn: 'Register',
      noAccount: 'No account?',
      hasAccount: 'Have an account?',
      loginFailed: 'Login failed',
      registerFailed: 'Registration failed',
      emailInUse: 'Email already exists',
      invalidCreds: 'Invalid email or password',
      systemError: 'System error, please try again',
      passwordMismatch: 'Passwords do not match',
      weakPassword: 'Password must be at least 8 characters and include uppercase, lowercase, and a number'
    },
    admin: {
      title: 'Admin Control Panel',
      searchPlaceholder: 'Search by email/username...',
      userList: 'User List',
      edit: 'Edit',
      delete: 'Delete',
      cancel: 'Cancel',
      save: 'Save',
      confirmDelete: 'Are you sure you want to delete this user?',
      cannotDeleteSelf: 'Cannot delete yourself',
      updateSuccess: 'Updated successfully',
      updateFailed: 'Update failed',
      deleteSuccess: 'Deleted successfully',
      deleteFailed: 'Deletion failed',
      role: 'Role',
      plan: 'Plan',
      status: 'Status',
      grantVip: 'Set PRO',
      revokeVip: 'Revoke VIP'
    },
    dashboard: {
      title: 'User Dashboard',
      welcome: 'Welcome, ',
      subscriptionPlan: 'Subscription Plan',
      accountStatus: 'Account Status',
      freeTrialRemaining: 'Free Trial Remaining: ',
      logout: 'Logout',
      goAI: 'Go to AI',
      upgradeAI: 'Upgrade AI',
      planLabels: { free: 'Free Trial', startup: 'Startup', pro: 'Pro', na: 'N/A' },
      statusLabels: { trial: 'Trial', active: 'Active', expired: 'Expired', cancelled: 'Cancelled', na: 'N/A' },
      myFiles: 'My Files',
      uploadFile: 'Upload File',
      noFiles: 'No files uploaded yet.',
      uploadFailed: 'Upload failed'
    },
    hero: {
      stockCode: 'SZSE Stock Code: 301558',
      line1: 'Believing in the infinite possibilities of AI,',
      line2: 'Determined to be the pilot and practitioner',
      line2_sub: 'of industry intelligence.',
      aiButton: 'One-click AI SaaS',
      start: 'Start'
    },
    aiSaas: {
      section1Title: 'AI x Cross-border E-commerce',
      section1Sub: 'Industry Intelligent Solutions',
      section1Desc: 'With decades of experience in cross-border e-commerce, LuQiNanYang has accumulated AI applications for cost reduction and efficiency improvement in smart logistics and talent management, and is exploring new shopping methods for the future.',
      card1Title: 'LuQi Smart Check',
      card1Desc: 'One-stop cross-border compliance detection tool',
      card2Title: 'ECI Index',
      card2Desc: 'Identifying excellent talents through multi-dimensional talent characteristics and clustering',
      card3Title: 'Smart Logistics',
      card3Desc: 'Using machine learning for sales forecasting and supply chain management to improve efficiency',
      card4Title: 'Shopping Assistant',
      card4Desc: 'The new generation of e-commerce shopping experience',
      
      section2Title: 'AI x Infringement Radar',
      section2Sub: 'Compliance Toolbox',
      section2Desc: 'Focusing on providing one-stop risk detection and patent multi-modal query services for cross-border e-commerce sellers, including trademark radar, patent radar, platform policy radar, and legal radar.',
      btnWebsite: 'Smart Check',
      cardRadar1Title: 'Trademark Radar',
      cardRadar1Desc: 'Daily updated trademark database, AI assists in judging actual risks',
      cardRadar2Title: 'Patent Radar',
      cardRadar2Desc: 'Intelligent matching of similar patents, risks at a glance',
      cardRadar3Title: 'Image Radar',
      cardRadar3Desc: 'Adopts multi-modal (image-text) recall strategy, adept at identifying trademark features from complex backgrounds.',
      cardRadar4Title: 'Policy Radar',
      cardRadar4Desc: 'Real-time matching of Amazon, eBay and other platform policies for worry-free compliance'
    },
    pricing: {
      title: 'Pricing & Subscription',
      subtitle: 'Choose the best plan for your business scale',
      free: {
        name: 'Free Trial',
        period: 'Forever',
        features: ['Basic keyword search (10 times/day)', 'Basic policy interpretation', 'Single language interface'],
        button: 'Current Plan'
      },
      startup: {
        name: 'Startup',
        period: '/ Month',
        features: ['All Free features', 'Multi-modal graphic check (50 times/day)', 'Real-time API access (Rate limited)', 'Priority Email Support'],
        button: 'Upgrade to Startup',
        price: 'RM 59'
      },
      pro: {
        name: 'Pro',
        period: '/ Year',
        features: ['Exclusive Private Model Tuning', 'Unlimited Multi-modal Check', 'Full ECI System Access', 'Bilateral Expert Consultation (1/month)', '24/7 Dedicated Support'],
        button: 'Upgrade to Pro',
        price: 'RM 5,999'
      }
    },
    chat: {
      welcome: 'Welcome to the AI SaaS Lab. I am your intelligent assistant. What would you like to know about Cross-border E-commerce, Smart Logistics, or AI SaaS?',
      inputPlaceholder: 'Ask about AI solutions...'
    }
  }
};