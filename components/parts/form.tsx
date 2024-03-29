"use client";
import { zodResolver } from "@hookform/resolvers/zod";
import { toastMessage } from "@lib/helpers/toast";
import {
  contactMeFormSchema,
  forgotPasswordFormSchema,
  loginFormSchema,
  loginVerificationFormSchema,
  signUpFormSchema,
  TContactMeFormSchema,
  TForgotPasswordFormSchema,
  TLoginFormSchema,
  TLoginVerificationFormSchema,
  TSignUpFormSchema,
} from "@lib/types/form";
import axios from "axios";
import bcrypt from "bcryptjs";
import { sanitize } from "dompurify";
import { signIn } from "next-auth/react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { SubmitHandler, useForm } from "react-hook-form";
import {
  FaInstagram,
  FaLinkedinIn,
  FaMailBulk,
  FaTwitter,
  FaYoutube,
} from "react-icons/fa";
import {
  HiArrowLeft,
  HiAtSymbol,
  HiFingerPrint,
  HiOutlineUser,
} from "react-icons/hi2";
import { Heading } from "../styled/typography";
import InputField from "./input-field";
import SocialFormButton from "./social-form-button";
import SubmitButton from "./submit-button";
import * as process from "process";

const emailProviders = [
  "gmail.com",
  "outlook.com",
  "yahoo.com",
  "zoho.com",
  "protonmail.com",
  "aol.com",
  "yandex.com",
  "icloud.com",
  "fastmail.com",
  "gmx.com",
];

const checkEmailValid = (email: string) => {
  const emailParts0 = ".com";
  const emailParts1 = email.split(emailParts0);
  const emailParts2 = emailParts1[0].split("@").slice(-1);
  const emailDomain = emailParts2 + emailParts0;

  return emailProviders.includes(emailDomain);
};

const Form = ({
  type,
}: {
  type: "signup" | "login" | "contact" | "forgotPassword" | "loginVerification";
}) => {
  const navigator = useRouter();

  const [formType, setFormType] = useState<
    "signup" | "login" | "contact" | "forgotPassword" | "loginVerification"
  >(type);

  const [signUpEmailError, setSignUpEmailError] = useState<string | undefined>(
    undefined
  );
  const [showPassword, setShowPassword] = useState<{
    password: boolean;
    confirmPassword: boolean;
  }>({
    password: false,
    confirmPassword: false,
  });

  const {
    register: signUpRegister,
    reset: signUpReset,
    handleSubmit: signUpHandleSubmit,
    formState: { errors: signUpErrors, isSubmitting: isSignupSubmitting },
  } = useForm<TSignUpFormSchema>({ resolver: zodResolver(signUpFormSchema) });

  const {
    register: loginRegister,
    reset: loginReset,
    handleSubmit: loginHandleSubmit,
    formState: { errors: loginErrors, isSubmitting: isLoginSubmitting },
  } = useForm<TLoginFormSchema>({ resolver: zodResolver(loginFormSchema) });

  const {
    register: loginVerificationRegister,
    reset: loginVerificationReset,
    handleSubmit: loginVerificationHandleSubmit,
    formState: { errors: loginVerificationErrors },
  } = useForm<TLoginVerificationFormSchema>({
    resolver: zodResolver(loginVerificationFormSchema),
  });

  const {
    register: forgotPassword,
    reset: forgotPasswordReset,
    handleSubmit: forgotPasswordHandleSubmit,
    formState: {
      errors: forgotPasswordErrors,
      isSubmitting: isForgotPasswordSubmitting,
    },
  } = useForm<TForgotPasswordFormSchema>({
    resolver: zodResolver(forgotPasswordFormSchema),
  });

  const {
    register: contactRegister,
    reset: contactReset,
    handleSubmit: contactHandleSubmit,
    formState: { errors: contactErrors, isSubmitting: isContactSubmitting },
  } = useForm<TContactMeFormSchema>({
    resolver: zodResolver(contactMeFormSchema),
  });

  const changeFormType = ({
    type,
  }: {
    type:
      | "signup"
      | "login"
      | "contact"
      | "forgotPassword"
      | "loginVerification";
  }) => {
    setFormType(type);
  };

  const onSignUpSubmit: SubmitHandler<TSignUpFormSchema> = async (data) => {
    const sanitizedData = {
      username: sanitize(data.username),
      email: sanitize(data.email),
      password: sanitize(data.password),
    };

    if (!checkEmailValid(sanitizedData.email)) {
      setSignUpEmailError(
        `Supported email providers are ${emailProviders.join(", ")}`
      );
      return;
    }
    const hashPassword = await bcrypt.hash(
      sanitizedData.password,
      process.env.NEXT_PUBLIC_HASH_SALT!
    );
    const userData = {
      ...sanitizedData,
      password: hashPassword,
      signForNewsLetter: data.signForNewsLetter,
    };
    try {
      const response = await axios.post("/api/users/signup", { ...userData });
      const data = response.data;
      signUpReset();
      toastMessage("success", data?.message, "sign-up-success");
      setFormType("login");
    } catch (error: any) {
      console.log(error);
      toastMessage("error", error?.response?.data?.message, "sign-up-failed");
    }
  };

  const onLoginSubmit: SubmitHandler<TLoginFormSchema> = async (data) => {
    const sanitizedData = {
      email: sanitize(data.email),
      password: sanitize(data.password || ""),
      rememberMe: data.rememberMe,
    };
    const hashPassword = await bcrypt.hash(
      sanitizedData.password,
      process.env.NEXT_PUBLIC_HASH_SALT!
    );
    try {
      const status = await signIn("credentials", {
        redirect: false,
        email: sanitizedData.email,
        password: hashPassword,
        rememberMe: sanitizedData.rememberMe,
        callbackUrl: process.env.NEXT_PUBLIC_CALLBACK_URL!,
      });
      console.log(status);
      loginReset();
      if (status?.ok === false) {
        toastMessage(
          "error",
          `${
            status?.error === "CredentialsSignin"
              ? "Invalid username or password"
              : "Some error occurred. Please try again!"
          }`,
          "login-error"
        );
      }
      if (status?.ok === true) {
        toastMessage("success", `Welcome back`, "login-success");
        navigator.push(status?.url || "/");
      }
    } catch (error: any) {
      loginReset();
      toastMessage(
        "error",
        error?.response?.data?.message || "Some error happened",
        "login-failed"
      );
    }
  };

  const onLoginVerificationUpSubmit: SubmitHandler<
    TLoginVerificationFormSchema
  > = async (data) => {
    const sanitizedData = { verificationCode: sanitize(data.verificationCode) };
    const userData = { ...sanitizedData };
    try {
      await axios.post("/api/users/verify", { ...userData });
      loginVerificationReset();
      toastMessage("success", "Login code sent to your email", "login-success");
      navigator.push("/books");
    } catch (error: any) {
      loginVerificationReset();
      toastMessage(
        "error",
        error?.response?.data?.message || "Some error happened",
        "login-failed"
      );
    }
  };

  const onContactMeSubmit: SubmitHandler<TContactMeFormSchema> = async (
    data
  ) => {
    const sanitizedData = {
      name: sanitize(data.name),
      email: sanitize(data.email),
      subject: sanitize(data.subject),
      message: sanitize(data.message),
    };
    if (
      !sanitizedData.name ||
      !sanitizedData.email ||
      !sanitizedData.subject ||
      !sanitizedData.message
    ) {
      toastMessage(
        "error",
        "Please fill all the fields in the form",
        "contact-failed"
      );
      return;
    }
    try {
      const response = await axios.post("/api/users/contact", {
        ...sanitizedData,
      });
      const message = response.data.message;
      // contactReset();
      toastMessage("success", message, "contact-success");
    } catch (error: any) {
      contactReset();
      toastMessage(
        "error",
        error?.response?.data?.message || "Some error happened",
        "contact-failed"
      );
    }
  };

  let formContent = <></>;

  if (formType === "login") {
    formContent = (
      <form
        onSubmit={loginHandleSubmit(onLoginSubmit)}
        className="h-full p-0 form"
      >
        <section className="flex flex-col h-full md:flex-row">
          <section className="flex flex-col justify-center flex-1 gap-4 py-12 text-light gradient-black lg:py-0">
            <div className="flex items-center justify-center order-3 gap-2 mx-auto md:order-1 lg:w-3/4">
              <SocialFormButton
                provider="google"
                callbackUrl={process.env.NEXT_PUBLIC_CALLBACK_URL!}
                imageUrl="/assets/google/btn_google_light_normal_ios.svg"
                imageAlt="Sign in with Google"
              />
              <SocialFormButton
                provider="twitter"
                callbackUrl={process.env.NEXT_PUBLIC_CALLBACK_URL!}
                imageUrl="/assets/twitter/blue-logo.svg"
                imageAlt="Sign in with Twitter"
              />
              <SocialFormButton
                provider="github"
                callbackUrl={process.env.NEXT_PUBLIC_CALLBACK_URL!}
                imageUrl="/assets/github/github-mark.svg"
                imageAlt="Sign in with GitHub"
              />
            </div>
            <hr className="order-2 h-px my-8 bg-gray-700 border-0 md:order-2" />
            <div className="order-1 px-8 lg:mx-auto lg:px-0 lg:w-3/4 form-group md:order-3">
              <InputField
                inputId="email"
                label="Email"
                inputName="email"
                inputPlaceholder="vasudeveloper001@gmail.com"
                inputType="email"
                register={loginRegister}
                error={loginErrors?.email?.message || ""}
                emailError={signUpEmailError}
                icon={<HiAtSymbol className="w-6 h-6 text-dark" />}
              />
              <InputField
                inputId="password"
                label="Password"
                inputName="password"
                inputPlaceholder="********"
                inputType={showPassword.password ? "text" : "password"}
                register={loginRegister}
                error={loginErrors?.password?.message || ""}
                passwordElement={
                  <span
                    className="absolute right-0 flex items-center pr-4 cursor-pointer top-16 bottom-8"
                    onClick={() =>
                      setShowPassword({
                        ...showPassword,
                        password: !showPassword.password,
                      })
                    }
                  >
                    <HiFingerPrint className="w-6 h-6 text-dark" />
                  </span>
                }
              />
              <div className="form-group">
                <label className="items-center my-4 text-base font-normal cursor-pointer label">
                  <input
                    type="checkbox"
                    className="w-6 h-6 cursor-pointer text-dark focus:text-dark"
                    id="signForNewsLetter"
                    {...loginRegister("rememberMe")}
                  />{" "}
                  <span>Remember me</span>
                </label>
              </div>
              <div className="items-start gap-4 form-group">
                <SubmitButton isSubmitting={isLoginSubmitting} cta={"Login"} />
                <div className="flex flex-col items-end justify-end gap-4">
                  <span
                    className="cursor-pointer text-formText"
                    onClick={() => changeFormType({ type: "signup" })}
                  >
                    New here?{" "}
                    <span className="font-semibold gradient-text">Sign Up</span>
                  </span>
                </div>
                <div className="flex flex-col items-end justify-end gap-4">
                  <span
                    className="cursor-pointer text-formText"
                    onClick={() => changeFormType({ type: "forgotPassword" })}
                  >
                    Forgot password?{" "}
                    <span className="font-semibold gradient-text">
                      Reset Password
                    </span>
                  </span>
                </div>
                <Link
                  href={"/"}
                  className={
                    "flex items-center justify-center gap-2 text-light/40 hover:text-light"
                  }
                >
                  <HiArrowLeft />
                  <span>Back to Home</span>
                </Link>
              </div>
            </div>
          </section>
          <section className="flex-col items-center justify-center flex-1 hidden h-full gap-4 lg:flex gradient-highlight">
            <h1 className="w-full font-bold text-center title">Login</h1>
          </section>
        </section>
      </form>
    );
  }

  if (formType === "signup") {
    formContent = (
      <form
        onSubmit={signUpHandleSubmit(onSignUpSubmit)}
        className="h-full p-0 form"
      >
        <section className="flex flex-col h-full md:flex-row">
          <section className="flex flex-col justify-center flex-1 gap-4 py-12 text-light gradient-black lg:py-0">
            <div className="flex items-center justify-center order-3 gap-2 mx-auto md:order-1 lg:w-3/4">
              <SocialFormButton
                provider="google"
                callbackUrl={process.env.NEXT_PUBLIC_CALLBACK_URL!}
                imageUrl="/assets/google/btn_google_light_normal_ios.svg"
                imageAlt="Sign up with Google"
              />
              <SocialFormButton
                provider="twitter"
                callbackUrl={process.env.NEXT_PUBLIC_CALLBACK_URL!}
                imageUrl="/assets/twitter/blue-logo.svg"
                imageAlt="Sign up with Twitter"
              />
              <SocialFormButton
                provider="github"
                callbackUrl={process.env.NEXT_PUBLIC_CALLBACK_URL!}
                imageUrl="/assets/github/github-mark.svg"
                imageAlt="Sign up with GitHub"
              />
            </div>
            <hr className="order-2 h-px my-8 bg-gray-700 border-0 md:order-2" />
            <div className="order-1 px-8 lg:mx-auto lg:px-0 lg:w-3/4 form-group md:order-3">
              <InputField
                inputId="username"
                label="Username"
                inputName="username"
                inputPlaceholder="ibcoder001"
                inputType="text"
                register={signUpRegister}
                error={signUpErrors?.username?.message || ""}
                icon={<HiOutlineUser className="w-6 h-6 text-dark" />}
              />
              <InputField
                inputId="email"
                label="Email"
                inputName="email"
                inputPlaceholder="vasudeveloper001@gmail.com"
                inputType="email"
                register={signUpRegister}
                error={signUpErrors?.email?.message || ""}
                emailError={signUpEmailError}
                icon={<HiAtSymbol className="w-6 h-6 text-dark" />}
              />
              <InputField
                inputId="password"
                label="Password"
                inputName="password"
                inputPlaceholder="********"
                inputType={showPassword.password ? "text" : "password"}
                register={signUpRegister}
                error={signUpErrors?.password?.message || ""}
                passwordElement={
                  <span
                    className="absolute right-0 flex items-center pr-4 cursor-pointer top-16 bottom-8"
                    onClick={() =>
                      setShowPassword({
                        ...showPassword,
                        password: !showPassword.password,
                      })
                    }
                  >
                    <HiFingerPrint className="w-6 h-6 text-dark" />
                  </span>
                }
              />
              <InputField
                inputId="confirm-password"
                label="Confirm Password"
                inputName="confirmPassword"
                inputPlaceholder="********"
                inputType={showPassword.confirmPassword ? "text" : "password"}
                register={signUpRegister}
                error={signUpErrors?.confirmPassword?.message || ""}
                passwordElement={
                  <span
                    className="absolute right-0 flex items-center pr-4 cursor-pointer top-16 bottom-8 text-light"
                    onClick={() =>
                      setShowPassword({
                        ...showPassword,
                        confirmPassword: !showPassword.confirmPassword,
                      })
                    }
                  >
                    <HiFingerPrint className="w-6 h-6 text-dark" />
                  </span>
                }
              />
              <div className="form-group">
                <label className="items-center my-4 text-base font-normal cursor-pointer label">
                  <input
                    type="checkbox"
                    className="w-6 h-6 cursor-pointer text-dark focus:text-dark"
                    id="signForNewsLetter"
                    {...signUpRegister("signForNewsLetter")}
                  />{" "}
                  <span>Sign me up for weekly product updates for 6 weeks</span>
                </label>
              </div>
              <div className="items-start gap-4 form-group">
                <SubmitButton
                  isSubmitting={isSignupSubmitting}
                  cta={"Sign Up"}
                />
                <div className="flex flex-col items-end justify-end gap-4">
                  <span
                    className="cursor-pointer text-formText"
                    onClick={() => changeFormType({ type: "login" })}
                  >
                    Already a member?{" "}
                    <span className="font-semibold gradient-text">Login</span>
                  </span>
                </div>
                <Link
                  href={"/"}
                  className={
                    "flex items-center justify-center gap-2 text-light/40 hover:text-light"
                  }
                >
                  <HiArrowLeft />
                  <span>Back to Home</span>
                </Link>
              </div>
            </div>
          </section>
          <section className="flex-col items-center justify-center flex-1 hidden h-full gap-4 lg:flex gradient-highlight">
            <h1 className="w-full font-bold text-center title">Sign Up</h1>
          </section>
        </section>
      </form>
    );
  }

  if (type === "loginVerification") {
    formContent = (
      <section className="py-8 xl:flex-1 xl:pl-16 xl:pr-0 xl:block">
        <Heading>Enter the code</Heading>
        <form
          onSubmit={loginVerificationHandleSubmit(onLoginVerificationUpSubmit)}
          className="mt-8 form"
        >
          <div className="form-group">
            <label
              htmlFor="verificationCode"
              className="flex items-end gap-2 text-formText"
            >
              Verification Code
              <span className="text-base text-red-700">
                {loginVerificationErrors?.verificationCode?.message}
              </span>
            </label>
            <input
              type="text"
              className="py-4 text-formText text-dark placeholder:text-dark/50"
              id="verificationCode"
              placeholder="example@ibcoder.com"
              required
              {...loginVerificationRegister("verificationCode")}
            />
          </div>
        </form>
      </section>
    );
  }

  // if (formType === "newsletter") {
  //     formContent = <section className='flex flex-col items-center justify-center w-full h-full max-w-3xl gap-8 px-4 py-12 mx-auto lg:max-w-5xl'>
  //         <p className='text-2xl text-center '>Thank you! You will receive product update every week for next 6 weeks!</p>
  //         <button type='button' className='flex items-center text-center btn-medium bg-dark text-light'>
  //             <Link href="/auth/login" className='w-full'>Login</Link>
  //         </button>
  //     </section>;
  // }

  if (formType === "contact") {
    formContent = (
      <section className="flex flex-col items-center justify-center w-full h-full px-4">
        <form
          onSubmit={contactHandleSubmit(onContactMeSubmit)}
          className="form"
        >
          <h1 className="w-full pt-12 font-bold text-center title">
            Contact Information
          </h1>
          <p className="w-full mb-4 text-xl text-center title">
            Please fill the form. I would love to get in touch with you.
          </p>
          <section className="flex flex-col md:flex-row md:gap-12">
            <section className="flex flex-col items-start justify-center flex-1 gap-4 p-6 rounded-md gradient-highlight">
              <h2 className="w-full text-3xl text-left title text-highlight">
                Love to hear from you. Get in touch 👋
              </h2>
              <div className="flex flex-col items-start justify-center gap-2 mt-8">
                <div className="flex flex-col items-start justify-start gap-4">
                  <a
                    href="mailto:vasudeveloper001@gmail.com"
                    className="flex items-center justify-start gap-2 text-lg hover:underline"
                  >
                    <span>
                      <FaMailBulk width={24} height={24} />
                    </span>
                    <span>vasudeveloper001</span>
                  </a>
                  <a
                    href="https://twitter.com/saudev001"
                    className="flex items-center justify-start gap-2 text-lg hover:underline"
                  >
                    <span>
                      <FaTwitter width={24} height={24} />
                    </span>
                    <span>@saudev001</span>
                  </a>
                  <a
                    href="https://instagram.com/saudev001"
                    className="flex items-center justify-start gap-2 text-lg hover:underline"
                  >
                    <span>
                      <FaInstagram width={24} height={24} />
                    </span>
                    <span>@saudev001</span>
                  </a>
                  <a
                    href="https://youtube.com/@ibcoder"
                    className="flex items-center justify-start gap-2 text-lg hover:underline"
                  >
                    <span>
                      <FaYoutube width={24} height={24} />
                    </span>
                    <span>@ibcoder</span>
                  </a>
                  <a
                    href="https://www.linkedin.com/in/saudev001"
                    className="flex items-center justify-start gap-2 text-lg hover:underline"
                  >
                    <span>
                      <FaLinkedinIn width={24} height={24} />
                    </span>
                    <span>@saudev001</span>
                  </a>
                </div>
              </div>
            </section>
            <section className="flex flex-col flex-1 gap-4 mt-6 md:mt-0">
              <div className="form-group">
                <label htmlFor="name" className="label">
                  Name <span>*</span>
                  <span className="text-base text-red-700">
                    {contactErrors?.name?.message}
                  </span>
                </label>
                <input
                  type="text"
                  className="py-4 text-lg font-bold text-dark placeholder:text-dark/50"
                  id="name"
                  placeholder="Vasudev Krishna"
                  required
                  {...contactRegister("name")}
                />
              </div>
              <div className="form-group">
                <label htmlFor="email" className="label">
                  Email <span>*</span>
                  <span className="text-base text-red-700">
                    {contactErrors?.email?.message}
                  </span>
                </label>
                <input
                  type="email"
                  className="py-4 text-lg font-bold text-dark placeholder:text-dark/50"
                  id="email"
                  placeholder="example@gmail.com"
                  required
                  {...contactRegister("email")}
                />
              </div>
              <div className="form-group">
                <label htmlFor="subject" className="label">
                  Subject <span>*</span>
                  <span className="text-base text-red-700">
                    {contactErrors?.subject?.message}
                  </span>
                </label>
                <input
                  type="text"
                  className="py-4 text-lg font-bold text-dark placeholder:text-dark/50"
                  id="subject"
                  placeholder="Want to become an author"
                  required
                  {...contactRegister("subject")}
                />
              </div>
              <div className="form-group">
                <label htmlFor="message" className="label">
                  Message <span>*</span>
                  <span className="text-base text-red-700">
                    {contactErrors?.message?.message}
                  </span>
                </label>
                <textarea
                  className="h-32 py-4 text-lg font-bold text-dark placeholder:text-dark/50"
                  id="message"
                  placeholder="Enter your message here..."
                  required
                  {...contactRegister("message")}
                />
              </div>
              {isContactSubmitting ? (
                <div className="form-group-button">
                  <button
                    type="button"
                    className="flex items-center btn-medium bg-dark/10 text-dark"
                  >
                    <svg
                      className="w-5 h-5 mr-3 text-light animate-spin"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    <span>Sending...</span>
                  </button>
                </div>
              ) : (
                <div className="form-group-button">
                  <button
                    type="submit"
                    className="flex items-center btn-medium bg-light text-dark"
                  >
                    <span>Send Message</span>
                  </button>
                </div>
              )}
            </section>
          </section>
        </form>
      </section>
    );
  }

  return formContent;
};

export default Form;
