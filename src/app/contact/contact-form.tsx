"use client";

import * as React from "react";
import { Send, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { useUserStore, selectIsLoggedIn, selectUsername } from "@/store/user-store";

type FormStatus = "idle" | "loading" | "success" | "error";

/**
 * Contact form component.
 *
 * Automatically fills in the logged-in user's username and submits
 * messages to the /api/contact endpoint.
 */
export function ContactForm() {
  const isLoggedIn = useUserStore(selectIsLoggedIn);
  const username = useUserStore(selectUsername);

  const [subject, setSubject] = React.useState("");
  const [message, setMessage] = React.useState("");
  const [status, setStatus] = React.useState<FormStatus>("idle");
  const [statusMessage, setStatusMessage] = React.useState("");

  const displayUsername = isLoggedIn && username ? username : "Anonymous";

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // Client-side validation
    if (!subject.trim()) {
      setStatus("error");
      setStatusMessage("Please enter a subject.");
      return;
    }

    if (!message.trim()) {
      setStatus("error");
      setStatusMessage("Please enter a message.");
      return;
    }

    setStatus("loading");
    setStatusMessage("");

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: displayUsername,
          subject: subject.trim(),
          message: message.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok && !data.success) {
        setStatus("error");
        setStatusMessage(data.error || "Something went wrong. Please try again.");
        return;
      }

      setStatus("success");
      setStatusMessage(data.note || "Your message has been sent successfully!");
      setSubject("");
      setMessage("");
    } catch {
      setStatus("error");
      setStatusMessage("Failed to send message. Please try again later.");
    }
  };

  const resetForm = () => {
    setStatus("idle");
    setStatusMessage("");
  };

  // Success state
  if (status === "success") {
    return (
      <div className="bg-sub-alt rounded-2xl p-8 md:p-12 max-w-2xl mx-auto text-center">
        <div className="flex justify-center mb-4">
          <div className="w-16 h-16 bg-main/10 rounded-full flex items-center justify-center">
            <CheckCircle className="w-8 h-8 text-main" />
          </div>
        </div>
        <h3 className="text-2xl font-bold text-text mb-2">Message Sent!</h3>
        <p className="text-sub mb-6">{statusMessage}</p>
        <button
          onClick={resetForm}
          className="inline-flex items-center gap-2 px-6 py-3 bg-main text-bg rounded-lg font-medium hover:opacity-90 transition-opacity"
        >
          Send Another Message
        </button>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-sub-alt rounded-2xl p-8 md:p-12 max-w-2xl mx-auto"
    >
      <h2 className="text-2xl font-bold text-text mb-2">Send us a Message</h2>
      <p className="text-sub mb-8">
        Fill out the form below and we will get back to you as soon as possible.
      </p>

      {/* Username (read-only) */}
      <div className="mb-6">
        <label
          htmlFor="contact-username"
          className="block text-sm font-medium text-sub mb-2"
        >
          Username
        </label>
        <input
          id="contact-username"
          type="text"
          value={displayUsername}
          readOnly
          className="w-full rounded-lg bg-bg border border-sub/20 px-4 py-3 text-text text-sm cursor-not-allowed opacity-70 focus:outline-none"
        />
        {!isLoggedIn && (
          <p className="mt-1 text-xs text-sub">
            Log in to automatically include your username.
          </p>
        )}
      </div>

      {/* Subject */}
      <div className="mb-6">
        <label
          htmlFor="contact-subject"
          className="block text-sm font-medium text-sub mb-2"
        >
          Subject <span className="text-error">*</span>
        </label>
        <input
          id="contact-subject"
          type="text"
          value={subject}
          onChange={(e) => {
            setSubject(e.target.value);
            if (status === "error") setStatus("idle");
          }}
          placeholder="What is this about?"
          required
          maxLength={200}
          className="w-full rounded-lg bg-bg border border-sub/20 px-4 py-3 text-text text-sm placeholder:text-sub/50 focus:outline-none focus:ring-2 focus:ring-main focus:border-transparent transition-all duration-150"
        />
      </div>

      {/* Message */}
      <div className="mb-6">
        <label
          htmlFor="contact-message"
          className="block text-sm font-medium text-sub mb-2"
        >
          Message <span className="text-error">*</span>
        </label>
        <textarea
          id="contact-message"
          value={message}
          onChange={(e) => {
            setMessage(e.target.value);
            if (status === "error") setStatus("idle");
          }}
          placeholder="Describe your question, suggestion, or issue..."
          required
          maxLength={5000}
          rows={6}
          className="w-full rounded-lg bg-bg border border-sub/20 px-4 py-3 text-text text-sm placeholder:text-sub/50 resize-y min-h-[120px] focus:outline-none focus:ring-2 focus:ring-main focus:border-transparent transition-all duration-150"
        />
        <p className="mt-1 text-xs text-sub text-right">
          {message.length} / 5000
        </p>
      </div>

      {/* Error message */}
      {status === "error" && statusMessage && (
        <div className="mb-6 flex items-center gap-2 rounded-lg bg-error/10 border border-error/20 px-4 py-3 text-sm text-error">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{statusMessage}</span>
        </div>
      )}

      {/* Submit */}
      <button
        type="submit"
        disabled={status === "loading"}
        className="inline-flex items-center justify-center gap-2 w-full px-6 py-3 bg-main text-bg rounded-lg font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {status === "loading" ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            Sending...
          </>
        ) : (
          <>
            <Send className="w-5 h-5" />
            Send Message
          </>
        )}
      </button>
    </form>
  );
}
