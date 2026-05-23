import React, { useState, useEffect } from "react";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
} from "firebase/auth";
import { auth, db, googleProvider } from "../lib/firebase";
import { ShieldAlert, AlertCircle, Eye, EyeOff } from "lucide-react";
import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  doc,
  updateDoc,
} from "firebase/firestore";

interface LoginProps {
  onLoginSuccess: (admin: any) => void;
}

export function Login({ onLoginSuccess }: LoginProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [noAdminsExist, setNoAdminsExist] = useState(false);

  useEffect(() => {
    // Verificar se existe algum admin
    const checkAdmins = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "admins"));
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
    setError("");
    try {
      const emailForm = email || "admin@admin.com";
      const passwordForm = password || "admin123";

      const userCred = await createUserWithEmailAndPassword(
        auth,
        emailForm,
        passwordForm,
      );
      const adminData = {
        funcionarioId: "seed",
        nomeFuncionario: "Administrador Master",
        email: emailForm,
        nivel: "master",
        status: "Ativo",
        contato: "",
        fotoUrl: "",
        authUid: userCred.user.uid,
        createdAt: Date.now(),
      };
      const docRef = await addDoc(collection(db, "admins"), adminData);
      setNoAdminsExist(false);
      onLoginSuccess({ id: docRef.id, ...adminData });
    } catch (err: any) {
      console.error(err);
      setError("Erro ao criar admin inicial: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const processAdminLogin = async (user: any) => {
    // Buscar dados do admin
    const q = query(collection(db, "admins"), where("authUid", "==", user.uid));
    let querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      // Tentar procurar por e-mail, caso tenha sido cadastrado o Google com o mesmo e-mail antes
      const qByEmail = query(
        collection(db, "admins"),
        where("email", "==", user.email),
      );
      querySnapshot = await getDocs(qByEmail);
      if (querySnapshot.empty) {
        // Auto-cadastro para o email do desenvolvedor (temporário para testes)
        if (user.email === "l2xbrasil@gmail.com") {
          const adminData = {
            funcionarioId: "seed",
            nomeFuncionario: user.displayName || "Administrador L2X",
            email: user.email,
            nivel: "master",
            status: "Ativo",
            contato: "",
            fotoUrl: user.photoURL || "",
            authUid: user.uid,
            createdAt: Date.now(),
          };
          const docRef = await addDoc(collection(db, "admins"), adminData);
          onLoginSuccess({ id: docRef.id, ...adminData });
          return;
        }

        setError("Usuário não é um administrador do sistema.");
        auth.signOut();
        return;
      }

      // Update the document to link this authUid!
      const adminDoc = querySnapshot.docs[0];
      await updateDoc(doc(db, "admins", adminDoc.id), { authUid: user.uid });
    }

    const adminData = querySnapshot.docs[0].data();

    if (adminData.status !== "Ativo") {
      setError("Administrador inativo.");
      auth.signOut();
      return;
    }

    onLoginSuccess({ id: querySnapshot.docs[0].id, ...adminData });
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError("Preencha os campos de email e senha.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      // Autenticar com Firebase
      const userCred = await signInWithEmailAndPassword(auth, email, password);
      await processAdminLogin(userCred.user);
    } catch (err: any) {
      console.error(err);
      setError("Credenciais inválidas ou erro no servidor.");
      auth.signOut();
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError("");

    try {
      const userCred = await signInWithPopup(auth, googleProvider);

      if (noAdminsExist) {
        // Auto-seed para login com Google se for a primeira vez no sistema!
        const adminData = {
          funcionarioId: "seed",
          nomeFuncionario: userCred.user.displayName || "Administrador Master",
          email: userCred.user.email || "admin@admin.com",
          nivel: "master",
          status: "Ativo",
          contato: "",
          fotoUrl: userCred.user.photoURL || "",
          authUid: userCred.user.uid,
          createdAt: Date.now(),
        };
        const docRef = await addDoc(collection(db, "admins"), adminData);
        setNoAdminsExist(false);
        onLoginSuccess({ id: docRef.id, ...adminData });
        return;
      }

      await processAdminLogin(userCred.user);
    } catch (err: any) {
      console.error(err);
      setError("Erro ao autenticar com Google ou permissão negada.");
      auth.signOut();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[100dvh] bg-[#0D2027] flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-md bg-[#152A32] rounded-3xl shadow-xl overflow-hidden border border-[#253B44]">
        <div className="bg-[#FFA767] p-8 text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 -trate-y-1/2 translate-x-1/2 w-48 h-48 bg-[#152A32] rounded-full blur-2xl"></div>
          <div className="absolute bottom-0 left-0 translate-y-1/2 -translate-x-1/2 w-32 h-32 bg-black/10 rounded-full blur-xl"></div>
          <div className="relative z-10 flex flex-col items-center">
            <div className="w-16 h-16 bg-[#152A32] flex items-center justify-center rounded-2xl shadow-lg mb-4">
              <ShieldAlert size={32} className="text-[#FFA767]" />
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

          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full bg-[#152A32] border border-[#2C4550] text-[#CBD5E1] font-bold rounded-xl py-4 flex items-center justify-center gap-3 shadow-sm hover:bg-[#0D2027] hover:border-[#36525E] transition-colors mb-6 disabled:opacity-50"
          >
            <svg
              className="w-5 h-5"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg>
            Entrar com Google
          </button>

          <div className="relative flex items-center justify-center mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[#2C4550]"></div>
            </div>
            <div className="relative bg-[#152A32] px-4 text-sm text-[#475569] font-medium tracking-wide">
              OU E-MAIL
            </div>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-[#CBD5E1]">
                E-mail
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@empresa.com"
                className="w-full border border-[#2C4550] rounded-xl p-3 focus:ring-2 focus:ring-[#FFA767] outline-none transition-shadow hover:border-[#36525E]"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-[#CBD5E1]">
                Senha
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full border border-[#2C4550] rounded-xl py-3 pl-3 pr-12 focus:ring-2 focus:ring-[#FFA767] outline-none transition-shadow hover:border-[#36525E]"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#475569] hover:text-[#94A3B8] p-1"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || noAdminsExist}
              className="w-full bg-[#FFA767] text-white font-bold rounded-xl py-4 flex items-center justify-center shadow-md hover:bg-[#E08E55] transition-colors mt-6 disabled:opacity-50"
            >
              {loading ? "Acessando..." : "Entrar com Senha"}
            </button>

            {noAdminsExist && (
              <div className="mt-4 p-4 bg-orange-50 border border-orange-200 rounded-xl">
                <p className="text-orange-800 text-sm mb-3">
                  Nenhum administrador encontrado no banco. Digite um e-mail e
                  senha acima e clique no botão abaixo para criar o primeiro
                  admin master.
                </p>
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
      <p className="mt-8 text-sm text-[#475569] font-medium text-center">
        Protegido por Segurança Firebase
      </p>
    </div>
  );
}
