import React, { useState, useEffect } from 'react';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { auth, db } from '../lib/firebase';
import { ShieldAlert, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { collection, query, where, getDocs, addDoc } from 'firebase/firestore';

interface LoginProps {
  onLoginSuccess: (admin: any) => void;
}

export function Login({ onLoginSuccess }: LoginProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [noAdminsExist, setNoAdminsExist] = useState(false);

  useEffect(() => {
    // Verificar se existe algum admin
    const checkAdmins = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'admins'));
        if (querySnapshot.empty) {
          setNoAdminsExist(true);
        }
      } catch (err) {
        console.error("Erro ao verificar admins:", err);
      }
    };
    checkAdmins();
  }, []);

  const handleSeedAdmin = async () => {
    setLoading(true);
    setError('');
    try {
      const emailForm = email || 'admin@admin.com';
      const passwordForm = password || 'admin123';
      
      const userCred = await createUserWithEmailAndPassword(auth, emailForm, passwordForm);
      const adminData = {
        funcionarioId: 'seed',
        nomeFuncionario: 'Administrador Master',
        email: emailForm,
        nivel: 'master',
        status: 'Ativo',
        contato: '',
        fotoUrl: '',
        authUid: userCred.user.uid,
        createdAt: Date.now()
      };
      const docRef = await addDoc(collection(db, 'admins'), adminData);
      setNoAdminsExist(false);
      onLoginSuccess({ id: docRef.id, ...adminData });
    } catch (err: any) {
      console.error(err);
      setError('Erro ao criar admin inicial: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Preencha os campos de email e senha.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Autenticar com Firebase
      const userCred = await signInWithEmailAndPassword(auth, email, password);
      
      // Buscar dados do admin
      const q = query(collection(db, 'admins'), where('authUid', '==', userCred.user.uid));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        // Talvez esteja usando login antigo (pesquisar por email tbm)
        const qByEmail = query(collection(db, 'admins'), where('email', '==', email));
        const emailSnapshot = await getDocs(qByEmail);
        if (emailSnapshot.empty) {
            setError('Usuário não é um administrador do sistema.');
            auth.signOut();
            setLoading(false);
            return;
        }
        
        const adminData = emailSnapshot.docs[0].data();
        if(adminData.status !== 'Ativo') {
            setError('Administrador inativo.');
            auth.signOut();
            setLoading(false);
            return;
        }

        onLoginSuccess({ id: emailSnapshot.docs[0].id, ...adminData });
        return;
      }

      const adminData = querySnapshot.docs[0].data();
      
      if(adminData.status !== 'Ativo') {
        setError('Administrador inativo.');
        auth.signOut();
        setLoading(false);
        return;
      }

      onLoginSuccess({ id: querySnapshot.docs[0].id, ...adminData });
    } catch (err: any) {
      console.error(err);
      setError('Credenciais inválidas ou erro no servidor.');
      // O signOut automático em catch costuma ser bom aqui
      auth.signOut();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center p-4">
        <div className="w-full max-w-md bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100">
            <div className="bg-[#0B5C36] p-8 text-center relative overflow-hidden">
                <div className="absolute top-0 right-0 -trate-y-1/2 translate-x-1/2 w-48 h-48 bg-white/10 rounded-full blur-2xl"></div>
                <div className="absolute bottom-0 left-0 translate-y-1/2 -translate-x-1/2 w-32 h-32 bg-black/10 rounded-full blur-xl"></div>
                <div className="relative z-10 flex flex-col items-center">
                    <div className="w-16 h-16 bg-white flex items-center justify-center rounded-2xl shadow-lg mb-4">
                        <ShieldAlert size={32} className="text-[#0B5C36]" />
                    </div>
                    <h1 className="text-2xl font-bold text-white mb-2">EPI Manager</h1>
                    <p className="text-emerald-100 text-sm">Acesso Administrativo</p>
                </div>
            </div>

            <div className="p-8">
                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl flex items-center gap-3 mb-6">
                        <AlertCircle className="shrink-0" size={20} />
                        <span className="text-sm font-medium">{error}</span>
                    </div>
                )}

                <form onSubmit={handleLogin} className="space-y-5">
                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-gray-700">E-mail</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="admin@empresa.com"
                            className="w-full border border-gray-200 rounded-xl p-3 focus:ring-2 focus:ring-[#0B5C36] outline-none transition-shadow hover:border-gray-300"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-gray-700">Senha</label>
                        <div className="relative">
                            <input
                                type={showPassword ? "text" : "password"}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••"
                                className="w-full border border-gray-200 rounded-xl py-3 pl-3 pr-12 focus:ring-2 focus:ring-[#0B5C36] outline-none transition-shadow hover:border-gray-300"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1"
                            >
                                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                            </button>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading || noAdminsExist}
                        className="w-full bg-[#0B5C36] text-white font-bold rounded-xl py-4 flex items-center justify-center shadow-md hover:bg-[#094d2d] transition-colors mt-6 disabled:opacity-50"
                    >
                        {loading ? 'Acessando...' : 'Entrar no Sistema'}
                    </button>

                    {noAdminsExist && (
                        <div className="mt-4 p-4 bg-orange-50 border border-orange-200 rounded-xl">
                            <p className="text-orange-800 text-sm mb-3">Nenhum administrador encontrado no banco. Digite um e-mail e senha acima e clique no botão abaixo para criar o primeiro admin master.</p>
                            <button
                                type="button"
                                onClick={handleSeedAdmin}
                                disabled={loading}
                                className="w-full bg-orange-600 text-white font-bold rounded-xl py-3 shadow hover:bg-orange-700 transition"
                            >
                                Criar Admin Inicial
                            </button>
                        </div>
                    )}
                </form>
            </div>
        </div>
        <p className="mt-8 text-sm text-gray-400 font-medium text-center">Protegido por Segurança Firebase</p>
    </div>
  );
}
