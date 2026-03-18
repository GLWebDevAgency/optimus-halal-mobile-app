"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { SectionContainer } from "@/components/layout/section-container";
import { SectionHeader } from "@/components/layout/section-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Clock, Globe, Mail, MapPin, Send } from "lucide-react";
import { motion } from "motion/react";

type ContactFormData = {
  name: string;
  email: string;
  subject: string;
  message: string;
};

const subjects = [
  { value: "general", label: "Question générale" },
  { value: "bug", label: "Signaler un bug" },
  { value: "partnership", label: "Partenariat" },
  { value: "press", label: "Presse" },
  { value: "other", label: "Autre" },
];

const contactInfo = [
  {
    icon: Mail,
    title: "Email",
    value: "contact@naqiy.app",
  },
  {
    icon: Clock,
    title: "Réponse",
    value: "< 24h",
  },
  {
    icon: Globe,
    title: "Langues",
    value: "FR, EN, AR",
  },
  {
    icon: MapPin,
    title: "Siège",
    value: "Paris, France",
  },
];

export function Contact() {
  const [selectedSubject, setSelectedSubject] = useState<string>("");

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<ContactFormData>();

  const onSubmit = (data: ContactFormData) => {
    // Handle form submission
    console.log(data);
  };

  return (
    <SectionContainer id="contact">
      <SectionHeader subTitle="CONTACT" title="Parlons ensemble" />

      <div className="mt-12 grid gap-8 lg:grid-cols-5">
        {/* Contact info cards */}
        <div className="flex flex-col gap-4 lg:col-span-2">
          {contactInfo.map((info, index) => {
            const Icon = info.icon;
            return (
              <motion.div
                key={info.title}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
              >
                <Card className="transition-all duration-300 hover:border-gold/20">
                  <CardContent className="flex items-center gap-4">
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                      <Icon className="size-5 text-primary" />
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">
                        {info.title}
                      </div>
                      <div className="font-medium">{info.value}</div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>

        {/* Contact form */}
        <motion.div
          className="lg:col-span-3"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <Card>
            <CardContent>
              <form
                onSubmit={handleSubmit(onSubmit)}
                className="flex flex-col gap-5"
              >
                <div className="grid gap-5 sm:grid-cols-2">
                  {/* Name */}
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="contact-name">Nom</Label>
                    <Input
                      id="contact-name"
                      placeholder="Ton nom"
                      className="h-10"
                      {...register("name", {
                        required: "Le nom est requis",
                        minLength: {
                          value: 2,
                          message:
                            "Le nom doit contenir au moins 2 caractères",
                        },
                      })}
                    />
                    {errors.name && (
                      <p className="text-xs text-destructive">
                        {errors.name.message}
                      </p>
                    )}
                  </div>

                  {/* Email */}
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="contact-email">Email</Label>
                    <Input
                      id="contact-email"
                      type="email"
                      placeholder="ton@email.com"
                      className="h-10"
                      {...register("email", {
                        required: "L'email est requis",
                        pattern: {
                          value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                          message: "Adresse email invalide",
                        },
                      })}
                    />
                    {errors.email && (
                      <p className="text-xs text-destructive">
                        {errors.email.message}
                      </p>
                    )}
                  </div>
                </div>

                {/* Subject */}
                <div className="flex flex-col gap-2">
                  <Label>Sujet</Label>
                  <Select
                    value={selectedSubject}
                    onValueChange={(value) => {
                      setSelectedSubject(value as string);
                      setValue("subject", value as string, {
                        shouldValidate: true,
                      });
                    }}
                  >
                    <SelectTrigger className="h-10 w-full">
                      <SelectValue placeholder="Sélectionne un sujet" />
                    </SelectTrigger>
                    <SelectContent>
                      {subjects.map((subject) => (
                        <SelectItem key={subject.value} value={subject.value}>
                          {subject.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {/* Hidden input for react-hook-form validation */}
                  <input
                    type="hidden"
                    {...register("subject", {
                      required: "Veuillez sélectionner un sujet",
                    })}
                  />
                  {errors.subject && (
                    <p className="text-xs text-destructive">
                      {errors.subject.message}
                    </p>
                  )}
                </div>

                {/* Message */}
                <div className="flex flex-col gap-2">
                  <Label htmlFor="contact-message">Message</Label>
                  <Textarea
                    id="contact-message"
                    placeholder="Ton message..."
                    className="min-h-32"
                    {...register("message", {
                      required: "Le message est requis",
                      minLength: {
                        value: 10,
                        message:
                          "Le message doit contenir au moins 10 caractères",
                      },
                    })}
                  />
                  {errors.message && (
                    <p className="text-xs text-destructive">
                      {errors.message.message}
                    </p>
                  )}
                </div>

                <Button type="submit" size="lg" className="h-12 gap-2">
                  <Send className="size-4" />
                  Envoyer
                </Button>
              </form>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </SectionContainer>
  );
}
