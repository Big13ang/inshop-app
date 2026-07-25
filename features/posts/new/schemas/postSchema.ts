import { z } from "zod";
import { ERROR_MESSAGES } from "@/lib/constants/errors";

export const postBodySchema = z.object({
    caption: z
        .string({ message: ERROR_MESSAGES.validation.captionRequired })
        .min(10, { message: ERROR_MESSAGES.validation.minCaptionLength(10) }),
});

export type FormValues = z.infer<typeof postBodySchema>;

