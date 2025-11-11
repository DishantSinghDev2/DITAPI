"use client"

import { useState } from "react"
import useSWR from "swr"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { ScrollArea } from "@/components/ui/scroll-area"

const fetcher = (url: string) => fetch(url).then((res) => res.json())

export default function MessagesPage() {
  const { data: conversations } = useSWR("/api/messages", fetcher)
  const [selectedConversation, setSelectedConversation] = useState<any>(null)
  const { data: messages, mutate: mutateMessages } = useSWR(
    selectedConversation ? `/api/messages?conversationId=${selectedConversation._id}` : null,
    fetcher,
  )
  const [newMessage, setNewMessage] = useState("")
  const [sending, setSending] = useState(false)

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation) return

    setSending(true)
    try {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversationId: selectedConversation._id,
          recipientId: selectedConversation.recipientId,
          content: newMessage,
        }),
      })

      if (res.ok) {
        setNewMessage("")
        mutateMessages()
      }
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="container py-10">
      <h1 className="text-3xl font-bold mb-8">Messages</h1>

      <div className="grid grid-cols-3 gap-6 h-96">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Conversations</CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-full">
              <div className="space-y-2">
                {conversations?.data?.map((conv: any) => (
                  <div
                    key={conv._id}
                    onClick={() => setSelectedConversation(conv)}
                    className="p-2 border rounded cursor-pointer hover:bg-muted"
                  >
                    <p className="font-medium text-sm">{conv.lastMessage?.substring(0, 50)}...</p>
                    <p className="text-xs text-muted-foreground">{new Date(conv.lastMessageAt).toLocaleDateString()}</p>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {selectedConversation && (
          <Card className="col-span-2">
            <CardHeader>
              <CardTitle className="text-base">Conversation</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <ScrollArea className="h-64 border rounded p-4">
                <div className="space-y-3">
                  {messages?.data?.map((msg: any) => (
                    <div key={msg._id} className="text-sm">
                      <p className="font-medium">{msg.senderId}</p>
                      <p className="text-muted-foreground">{msg.content}</p>
                    </div>
                  ))}
                </div>
              </ScrollArea>

              <div className="flex gap-2">
                <Textarea
                  placeholder="Type message..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  rows={2}
                />
                <Button onClick={handleSendMessage} disabled={sending}>
                  Send
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
