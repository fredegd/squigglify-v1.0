"use client";

import { useState } from "react";
import { Check, Link } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import type { Settings } from "@/lib/types";
import { copyConfigUrlToClipboard } from "@/lib/utils/url-config";

interface ShareConfigButtonProps {
    settings: Settings;
    className?: string;
    variant?: "default" | "outline" | "ghost" | "secondary";
    size?: "default" | "sm" | "lg" | "icon";
}

export function ShareConfigButton({
    settings,
    className,
    variant = "outline",
    size = "sm",
}: ShareConfigButtonProps) {
    const [copied, setCopied] = useState(false);

    const handleClick = async () => {
        const success = await copyConfigUrlToClipboard(settings);
        if (success) {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    return (
        <Tooltip>
            <TooltipTrigger asChild>
                <Button
                    variant={variant}
                    size={size}
                    onClick={handleClick}
                    className={className}
                    aria-label={copied ? "Config URL copied!" : "Share config URL"}
                >
                    {copied ? (
                        <>
                            <Check className="h-4 w-4 mr-1 text-green-500" />
                            <span className="text-green-500">Copied!</span>
                        </>
                    ) : (
                        <>
                            <Link className="h-4 w-4 mr-1" />
                            <span>Share</span>
                        </>
                    )}
                </Button>
            </TooltipTrigger>
            <TooltipContent>
                <p>{copied ? "URL copied to clipboard!" : "Copy shareable config URL"}</p>
            </TooltipContent>
        </Tooltip>
    );
}
