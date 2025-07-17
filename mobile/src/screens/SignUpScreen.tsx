// mobile/src/screens/SignUpScreen.tsx
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import React from "react";
import AuthForm from "../components/AuthForm";
import useAsyncAction from "../hooks/useAsyncAction";
import useOnboard from "../hooks/useOnboard";
import { AuthStackParamList } from "../navigation/AuthNavigator";

export default function SignUpScreen({
  navigation,
}: NativeStackScreenProps<AuthStackParamList, "SignUp">) {
  const { register } = useOnboard();
  const [signUp, { loading }] = useAsyncAction(
    async (values) => await register(values.email, values.password),
    (e) => alert("Sign Up Failed: " + e.message)
  );

  return (
    <AuthForm
      header="Sign Up"
      fields={[
        { key: "email", label: "Email", keyboardType: "email-address" },
        { key: "password", label: "Password", secure: true },
      ]}
      submitLabel="Sign Up"
      submitting={loading}
      onSubmit={signUp}
      secondaryLabel="Have an account? Sign In"
      onSecondaryPress={() => navigation.goBack()}
    />
  );
}
