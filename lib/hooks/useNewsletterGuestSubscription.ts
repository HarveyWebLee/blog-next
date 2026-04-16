"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { message } from "@/lib/utils";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export type NewsletterGuestCopy = {
  invalidEmail: string;
  needSubscribeCode: string;
  needUnsubscribeCode: string;
  sendCodeOk: string;
  sendCodeFail: string;
  subscribeSuccess: string;
  subscribeFail: string;
  unsubscribeSuccess: string;
  unsubscribeFail: string;
};

/**
 * 访客邮件订阅：发码 → 填验证码 → 订阅/退订。
 * 已登录态由调用方自行维护（JWT + 账号邮箱），本 Hook 仅在 !isAuthenticated 时查询/更新访客订阅状态。
 */
export function useNewsletterGuestSubscription(isAuthenticated: boolean, copy: NewsletterGuestCopy) {
  const [subscribeEmail, setSubscribeEmail] = useState("");
  const [subscribeCode, setSubscribeCode] = useState("");
  const [guestIsSubscribed, setGuestIsSubscribed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [sendingCode, setSendingCode] = useState(false);
  const [cooldownSec, setCooldownSec] = useState(0);

  useEffect(() => {
    if (cooldownSec <= 0) return undefined;
    const timer = window.setInterval(() => setCooldownSec((s) => Math.max(0, s - 1)), 1000);
    return () => window.clearInterval(timer);
  }, [cooldownSec]);

  const debounceRef = useRef<number | undefined>(undefined);

  const fetchGuestSubscription = useCallback(async (raw: string) => {
    const email = raw.trim().toLowerCase();
    if (!EMAIL_RE.test(email)) {
      setGuestIsSubscribed(false);
      return;
    }
    try {
      const res = await fetch(`/api/subscriptions?email=${encodeURIComponent(email)}`);
      const result = await res.json();
      if (result.success) {
        setGuestIsSubscribed(Boolean(result.data?.isSubscribed));
      }
    } catch {
      setGuestIsSubscribed(false);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      setGuestIsSubscribed(false);
      setSubscribeCode("");
      return;
    }
    window.clearTimeout(debounceRef.current);
    debounceRef.current = window.setTimeout(() => {
      void fetchGuestSubscription(subscribeEmail);
    }, 450);
    return () => window.clearTimeout(debounceRef.current);
  }, [subscribeEmail, isAuthenticated, fetchGuestSubscription]);

  const beginCooldown = useCallback(() => {
    setCooldownSec(60);
  }, []);

  const sendVerification = useCallback(
    async (intent: "subscribe" | "unsubscribe") => {
      const email = subscribeEmail.trim().toLowerCase();
      if (!EMAIL_RE.test(email)) {
        message.warning(copy.invalidEmail);
        return;
      }
      try {
        setSendingCode(true);
        const type = intent === "subscribe" ? "subscription" : "subscription_unsubscribe";
        const res = await fetch("/api/auth/send-verification-code", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, type }),
        });
        const data = await res.json();
        if (!data.success) {
          message.error(data.message || copy.sendCodeFail);
          return;
        }
        message.success(copy.sendCodeOk);
        beginCooldown();
      } catch {
        message.error(copy.sendCodeFail);
      } finally {
        setSendingCode(false);
      }
    },
    [subscribeEmail, copy, beginCooldown]
  );

  const submitGuestSubscribe = useCallback(async () => {
    const email = subscribeEmail.trim().toLowerCase();
    if (!EMAIL_RE.test(email)) {
      message.warning(copy.invalidEmail);
      return;
    }
    const code = subscribeCode.trim();
    if (!code) {
      message.warning(copy.needSubscribeCode);
      return;
    }
    try {
      setSubmitting(true);
      const response = await fetch("/api/subscriptions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, verificationCode: code }),
      });
      const result = await response.json();
      if (!result.success) {
        message.error(result.message || copy.subscribeFail);
        return;
      }
      setSubscribeCode("");
      setGuestIsSubscribed(true);
      message.success(copy.subscribeSuccess);
    } catch {
      message.error(copy.subscribeFail);
    } finally {
      setSubmitting(false);
    }
  }, [subscribeEmail, subscribeCode, copy]);

  const submitGuestUnsubscribe = useCallback(async () => {
    const email = subscribeEmail.trim().toLowerCase();
    if (!EMAIL_RE.test(email)) {
      message.warning(copy.invalidEmail);
      return;
    }
    const code = subscribeCode.trim();
    if (!code) {
      message.warning(copy.needUnsubscribeCode);
      return;
    }
    try {
      setSubmitting(true);
      const response = await fetch("/api/subscriptions", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, verificationCode: code }),
      });
      const result = await response.json();
      if (!result.success) {
        message.error(result.message || copy.unsubscribeFail);
        return;
      }
      setSubscribeCode("");
      setGuestIsSubscribed(false);
      message.success(copy.unsubscribeSuccess);
    } catch {
      message.error(copy.unsubscribeFail);
    } finally {
      setSubmitting(false);
    }
  }, [subscribeEmail, subscribeCode, copy]);

  return {
    subscribeEmail,
    setSubscribeEmail,
    subscribeCode,
    setSubscribeCode,
    guestIsSubscribed,
    submitting,
    sendingCode,
    cooldownSec,
    sendVerification,
    submitGuestSubscribe,
    submitGuestUnsubscribe,
  };
}
