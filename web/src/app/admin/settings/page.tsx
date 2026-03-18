"use client"

import { Globe, HardDrives, ShieldCheck } from "@phosphor-icons/react"

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Parametres</h1>
        <p className="text-muted-foreground">
          Configuration globale de la plateforme Naqiy.
        </p>
      </div>

      <Tabs defaultValue="general">
        <TabsList>
          <TabsTrigger value="general">
            <Globe className="size-4" />
            General
          </TabsTrigger>
          <TabsTrigger value="api">
            <HardDrives className="size-4" />
            API
          </TabsTrigger>
          <TabsTrigger value="security">
            <ShieldCheck className="size-4" />
            Securite
          </TabsTrigger>
        </TabsList>

        {/* General tab */}
        <TabsContent value="general">
          <Card>
            <CardHeader>
              <CardTitle>Informations generales</CardTitle>
              <CardDescription>
                Configuration de base de l&apos;application Naqiy.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="app-name">Nom de l&apos;application</Label>
                <Input
                  id="app-name"
                  defaultValue="Naqiy"
                  readOnly
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="app-description">Description</Label>
                <Input
                  id="app-description"
                  defaultValue="L'information halal, pure et transparente"
                  readOnly
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Mode maintenance</Label>
                  <p className="text-sm text-muted-foreground">
                    Desactiver l&apos;acces a l&apos;application pour les
                    utilisateurs.
                  </p>
                </div>
                <Switch />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Inscriptions ouvertes</Label>
                  <p className="text-sm text-muted-foreground">
                    Autoriser les nouveaux utilisateurs a s&apos;inscrire.
                  </p>
                </div>
                <Switch defaultChecked />
              </div>

              <div className="flex justify-end">
                <Button>Enregistrer</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* API tab */}
        <TabsContent value="api">
          <Card>
            <CardHeader>
              <CardTitle>Configuration API</CardTitle>
              <CardDescription>
                Informations sur le backend et les limites de taux.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="api-url-prod">URL API Production</Label>
                <Input
                  id="api-url-prod"
                  defaultValue="https://api.naqiy.app"
                  readOnly
                  className="font-mono text-sm"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="api-url-preview">URL API Preview</Label>
                <Input
                  id="api-url-preview"
                  defaultValue="https://api-preview.naqiy.app"
                  readOnly
                  className="font-mono text-sm"
                />
              </div>

              <Separator />

              <div>
                <h3 className="mb-3 text-sm font-medium">
                  Limites de taux (rate limiting)
                </h3>
                <div className="space-y-3">
                  {[
                    { endpoint: "Scan produit", limit: "20 req/min" },
                    { endpoint: "Magasins a proximite", limit: "60 req/min" },
                    { endpoint: "Recherche", limit: "60 req/min" },
                    { endpoint: "Authentification", limit: "100 req/min" },
                    { endpoint: "General", limit: "300 req/min" },
                  ].map((rate) => (
                    <div
                      key={rate.endpoint}
                      className="flex items-center justify-between rounded-lg border px-3 py-2"
                    >
                      <span className="text-sm">{rate.endpoint}</span>
                      <span className="font-mono text-sm text-muted-foreground">
                        {rate.limit}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security tab */}
        <TabsContent value="security">
          <Card>
            <CardHeader>
              <CardTitle>Securite</CardTitle>
              <CardDescription>
                Politique de mots de passe et gestion des sessions.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="mb-3 text-sm font-medium">
                  Politique de mot de passe
                </h3>
                <div className="space-y-3">
                  {[
                    { label: "Longueur minimale", value: "8 caracteres" },
                    { label: "Majuscule requise", value: "Oui" },
                    { label: "Chiffre requis", value: "Oui" },
                    { label: "Caractere special requis", value: "Non" },
                  ].map((policy) => (
                    <div
                      key={policy.label}
                      className="flex items-center justify-between rounded-lg border px-3 py-2"
                    >
                      <span className="text-sm">{policy.label}</span>
                      <span className="text-sm text-muted-foreground">
                        {policy.value}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <Separator />

              <div>
                <h3 className="mb-3 text-sm font-medium">Sessions</h3>
                <div className="space-y-3">
                  {[
                    {
                      label: "Duree access token",
                      value: "15 minutes",
                    },
                    {
                      label: "Duree refresh token",
                      value: "30 jours",
                    },
                    {
                      label: "Tentatives de reinitialisation",
                      value: "3 max",
                    },
                    {
                      label: "Code de reinitialisation",
                      value: "6 caracteres hex, insensible a la casse",
                    },
                  ].map((session) => (
                    <div
                      key={session.label}
                      className="flex items-center justify-between rounded-lg border px-3 py-2"
                    >
                      <span className="text-sm">{session.label}</span>
                      <span className="text-sm text-muted-foreground">
                        {session.value}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end">
                <Button>Enregistrer</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
