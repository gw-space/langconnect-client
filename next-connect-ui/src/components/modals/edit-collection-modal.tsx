"use client"

import { useState, useEffect } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { 
  Folder,
  Code,
  Save,

  Edit
} from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
import { useTranslation } from "@/hooks/use-translation"
import { Collection } from "@/types/collection"

const editFormSchema = (t: (key: string) => string) => z.object({
  name: z.string().min(1, {
    message: t('collections.modal.namePlaceholder'),
  }),
  metadata: z.string().refine((value) => {
    try {
      JSON.parse(value)
      return true
    } catch {
      return false
    }
  }, {
    message: "Invalid JSON format",
  }),
})

interface EditCollectionModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
  collection: Collection | null
}

export function EditCollectionModal({ open, onOpenChange, onSuccess, collection }: EditCollectionModalProps) {
  const { t } = useTranslation()
  const [isLoading, setIsLoading] = useState(false)
  const formSchema = editFormSchema(t)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      metadata: "{}",
    },
  })

  // Update form values when collection changes
  useEffect(() => {
    if (collection) {
      form.reset({
        name: collection.name,
        metadata: JSON.stringify(collection.metadata || {}, null, 2),
      })
    }
  }, [collection, form])

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!collection) return

    setIsLoading(true)

    try {
      const response = await fetch(`/api/collections/${collection.uuid}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: values.name,
          metadata: JSON.parse(values.metadata)
        })
      })

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.message || t('collections.modal.updateError'))
      }

      toast.success(t('common.success'), {
        description: t('collections.modal.updateSuccess'),
      })
      
      onOpenChange(false)
      onSuccess?.()
    } catch (error: any) {
      console.error("Failed to update collection:", error)
      toast.error(t('common.error'), {
        description: error.message || t('collections.modal.updateError'),
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleCancel = () => {
    onOpenChange(false)
    form.reset()
  }

  if (!collection) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Edit className="h-5 w-5 text-blue-500" />
            {t('collections.modal.editTitle')}
          </DialogTitle>
          <DialogDescription>
            {t('collections.modal.editDescription')}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <Folder className="h-4 w-4 text-blue-500" />
                    {t('collections.modal.nameLabel')}
                  </FormLabel>
                  <FormControl>
                    <Input 
                      placeholder={t('collections.modal.namePlaceholder')}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="metadata"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <Code className="h-4 w-4 text-purple-500" />
                    {t('collections.modal.metadataLabel')}
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="{}"
                      className="font-mono text-sm"
                      rows={8}
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    {t('collections.modal.metadataDescription')}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={handleCancel}
                disabled={isLoading}
              >
                {t('common.cancel')}
              </Button>
              <Button
                type="submit"
                disabled={isLoading}
                className="bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600"
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                    {t('common.saving')}
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    {t('common.save')}
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
} 