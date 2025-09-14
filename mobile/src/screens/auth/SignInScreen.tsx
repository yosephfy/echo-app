// mobile/src/screens/SignInScreen.tsx
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import React from "react";
import AuthForm from "../../components/AuthForm";
import useAsyncAction from "../../hooks/useAsyncAction";
import useOnboard from "../../hooks/useOnboard";
import { AuthStackParamList } from "../../navigation/AuthNavigator";

export default function SignInScreen({
  navigation,
}: NativeStackScreenProps<AuthStackParamList, "SignIn">) {
  const { login } = useOnboard();
  const [signIn, { loading }] = useAsyncAction(
    async (values) => await login(values.email, values.password),
    (e) => alert("Sign In Failed: " + e.message)
  );

  return (
    <AuthForm
      header="Sign In"
      fields={[
        {
          key: "email",
          label: "Email",
          keyboardType: "email-address",
          textContentType: "emailAddress",
        },
        {
          key: "password",
          label: "Password",
          secure: true,
          textContentType: "password",
        },
      ]}
      submitLabel="Sign In"
      submitting={loading}
      onSubmit={signIn}
      secondaryLabel="Don't have an account? Sign Up"
      onSecondaryPress={() => navigation.navigate("SignUp")}
    />
  );
}
