import { button, type CardModel, type InputModel } from "@gym-platform/ui";
export type AuthScreenName = "login" | "register" | "forgot_password" | "reset_password" | "two_factor_setup" | "two_factor_verify" | "recovery_codes" | "recovery_login";
export interface AuthScreenModel {
    screen: AuthScreenName;
    title: string;
    fields: InputModel[];
    submit: ReturnType<typeof button>;
    secondaryAction?: ReturnType<typeof button>;
    card: CardModel;
}
export declare function buildLoginScreen(values?: {
    email?: string;
}): AuthScreenModel;
export declare function buildRegistrationScreen(values?: {
    email?: string;
    firstName?: string;
    lastName?: string;
}): AuthScreenModel;
export declare function buildForgotPasswordScreen(values?: {
    email?: string;
}): AuthScreenModel;
export declare function buildResetPasswordScreen(): AuthScreenModel;
export declare function buildTwoFactorSetupScreen(secret?: string): AuthScreenModel;
export declare function buildTwoFactorVerifyScreen(): AuthScreenModel;
export declare function buildRecoveryCodesScreen(codes: string[]): AuthScreenModel & {
    codes: string[];
};
export declare function buildRecoveryLoginScreen(): AuthScreenModel;
//# sourceMappingURL=screens.d.ts.map