import { motion } from 'motion/react';
import { Facebook, Github, Linkedin, Mail, Globe, Code2, Heart, GraduationCap, MessageCircle, Share2, Star, Coffee } from 'lucide-react';

export default function Developer() {
  const whatsappNumber = "201142211937";
  const appUrl = window.location.origin;

  const socialLinks = [
    { icon: Mail, label: 'البريد الإلكتروني', href: 'mailto:ahmedmaher4200266@gmail.com' },
    { icon: Facebook, label: 'فيسبوك', href: 'https://www.facebook.com/ahmed.alazahre' },
    { icon: MessageCircle, label: 'واتساب', href: `https://wa.me/${whatsappNumber}` },
  ];

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'تطبيق نور الحق',
          text: 'تطبيق إسلامي شامل لمواقيت الصلاة، القرآن، والأذكار. حمله الآن!',
          url: appUrl,
        });
      } catch (err) {
        console.error('Error sharing:', err);
      }
    } else {
      navigator.clipboard.writeText(appUrl);
      alert('تم نسخ رابط التطبيق!');
    }
  };

  return (
    <div className="h-full flex flex-col space-y-8 pb-10">
      <div className="text-center">
        <p className="text-[10px] uppercase tracking-[0.3em] text-sacred-gold font-bold mb-2">عن المطور</p>
        <h2 className="text-xl font-display font-bold">بطاقة المطور</h2>
      </div>

      {/* Profile Card */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="glass-card rounded-3xl p-8 flex flex-col items-center text-center space-y-6 relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-32 h-32 bg-sacred-gold/5 rounded-full -mr-16 -mt-16" />
        
        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-sacred-gold to-sacred-green p-1 shadow-xl">
          <div className="w-full h-full rounded-full bg-white flex items-center justify-center overflow-hidden">
             <Code2 className="w-12 h-12 text-sacred-gold" />
          </div>
        </div>

        <div className="space-y-2">
          <h3 className="font-amiri text-2xl font-bold text-sacred-green">المهندس أحمد ماهر عبد الهادي</h3>
          <p className="text-xs text-sacred-ink/60 flex items-center justify-center gap-2">
            <GraduationCap className="w-3 h-3" /> تلميذ الأزهر الشريف
          </p>
        </div>

        <p className="text-xs text-sacred-ink/70 leading-relaxed max-w-xs">
          مطور برمجيات شغوف بدمج التكنولوجيا الحديثة مع القيم الإسلامية لخدمة الأمة وتسهيل الوصول للعلوم الشرعية.
        </p>

        <div className="flex gap-4">
          {socialLinks.map((link, i) => (
            <motion.a
              key={i}
              href={link.href}
              whileHover={{ y: -3 }}
              whileTap={{ scale: 0.9 }}
              className="w-10 h-10 rounded-full bg-sacred-gold/10 flex items-center justify-center text-sacred-gold hover:bg-sacred-gold hover:text-white transition-all"
              title={link.label}
              target="_blank"
              rel="noopener noreferrer"
            >
              <link.icon className="w-5 h-5" />
            </motion.a>
          ))}
        </div>

        <motion.a
          href={`https://wa.me/${whatsappNumber}`}
          target="_blank"
          rel="noopener noreferrer"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="w-full bg-[#25D366] text-white py-3 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-green-200"
        >
          <MessageCircle className="w-5 h-5 fill-current" />
          تواصل معي عبر واتساب
        </motion.a>
      </motion.div>

      {/* App Actions */}
      <div className="space-y-4">
        <h4 className="text-[10px] uppercase tracking-widest text-sacred-gold font-bold text-center">دعم المشروع</h4>
        <div className="grid grid-cols-2 gap-4">
          <button 
            onClick={handleShare}
            className="glass-card p-4 rounded-2xl flex flex-col items-center gap-2 hover:bg-sacred-gold/5 transition-colors"
          >
            <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-500 flex items-center justify-center">
              <Share2 className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-bold">شارك التطبيق</span>
          </button>
          <button 
            className="glass-card p-4 rounded-2xl flex flex-col items-center gap-2 hover:bg-sacred-gold/5 transition-colors"
          >
            <div className="w-10 h-10 rounded-full bg-yellow-50 text-yellow-500 flex items-center justify-center">
              <Star className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-bold">قيم التطبيق</span>
          </button>
        </div>
      </div>

      {/* Expertise */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
        <div className="glass-card p-4 rounded-2xl text-center space-y-2 flex flex-col items-center">
          <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-500 flex items-center justify-center">
            <Code2 className="w-4 h-4" />
          </div>
          <h4 className="text-[10px] font-bold">تطوير التطبيقات</h4>
          <p className="text-[8px] text-sacred-ink/40">React, TypeScript, Node.js</p>
        </div>
        <div className="glass-card p-4 rounded-2xl text-center space-y-2 flex flex-col items-center">
          <div className="w-8 h-8 rounded-lg bg-green-50 text-green-500 flex items-center justify-center">
            <Heart className="w-4 h-4" />
          </div>
          <h4 className="text-[10px] font-bold">الذكاء الاصطناعي</h4>
          <p className="text-[8px] text-sacred-ink/40">Gemini AI, NLP</p>
        </div>
      </div>

      {/* Footer Credit */}
      <div className="mt-auto pt-10 text-center space-y-4">
        <div className="w-12 h-px bg-sacred-gold/20 mx-auto" />
        <p className="text-xs text-sacred-ink/60 leading-relaxed px-6">
          تم تطوير هذا التطبيق على يد تلميذ الأزهر الشريف <br />
          <span className="font-amiri text-lg font-bold text-sacred-gold">المهندس أحمد ماهر عبد الهادي</span>
        </p>
        <div className="flex items-center justify-center gap-1 text-[10px] text-sacred-ink/30">
          <span>صنع بكل حب</span>
          <Heart className="w-2 h-2 fill-red-400 text-red-400" />
          <span>لخدمة كتاب الله</span>
        </div>

        {/* Dedication */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="bg-sacred-gold/5 border border-sacred-gold/10 rounded-2xl p-6 mt-8"
        >
          <p className="font-amiri text-sm leading-relaxed text-sacred-ink/80 italic">
            "هذا التطبيق صدقة جارية على روح جدتي أم أمي وجدي أبو أبي، وأسأل الله العظيم أن يتغمدهم بواسع رحمته ويسكنهم فسيح جناته.. آمين"
          </p>
        </motion.div>
      </div>
    </div>
  );
}
