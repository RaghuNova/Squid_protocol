import React from "react";
import { EncryptedText } from "@/components/ui/encrypted-text";

export default function EncryptedTextDemo() {
  return (
    <div className="mx-auto flex max-w-lg items-center justify-center p-4">
      <p className="text-left font-mono text-sm text-gray-300">
        You are not your job, you&apos;re not how much money you have in the
        bank. You are not the car you drive. You&apos;re not the contents of
        your wallet. You are not your fucking khakis.{" "}
        <EncryptedText
          text="All singing, all dancing crap of the world."
          encryptedClassName="text-[#ff004f]"
          revealedClassName="text-white font-bold"
        />
      </p>
    </div>
  );
}
