import { z } from "zod";

export const registerSchema = z
  .object({
    name: z
      .string()
      .min(2, "Name must be at least 2 characters")
      .max(50),

    email: z
      .string()
      .email("Invalid email address"),

    phone: z
      .string()
      .optional(),

    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[A-Z]/, "Must contain one uppercase letter")
      .regex(/[a-z]/, "Must contain one lowercase letter")
      .regex(/[0-9]/, "Must contain one number")
      .regex(/[^A-Za-z0-9]/, "Must contain one special character"),

    confirmPassword: z.string(),

    acceptTerms: z.literal(true, {
      errorMap: () => ({
        message: "Please accept Terms & Privacy Policy"
      })
    })
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"]
  });

export const loginSchema = z.object({

    email:z.string().email(),

    password:z.string().min(8)

});