import React, { useState, useEffect, useRef } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

const samplePrompts = [
  "Write a story about Cameroon",
  "What is the meaning of life?",
  "How to make a cake?",
  "Quiz me on ancient civilizations?",
];

const Chat = () => {
  const [chatHistory, setChatHistory] = useState([]);
  const [currentChat, setCurrentChat] = useState([]);
  const [input, setInput] = useState("");
  const [chatTitle, setChatTitle] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [editingIndex, setEditingIndex] = useState(null);

  const chatContainerRef = useRef(null);

  const handleTitleEdit = (index) => {
    setIsEditing(true);
    setEditingIndex(index);
    setChatTitle(chatHistory[index].title);
  };

  const handleTitleChange = async (e) => {
    if (e.key === "Enter") {
      const updatedChats = [...chatHistory];
      updatedChats[editingIndex].title = chatTitle;

      // Update the chat in the database
      await fetch(
        `http://localhost:8000/api/chats/${chatHistory[editingIndex].id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            title: chatTitle,
            messages: updatedChats[editingIndex].messages,
          }),
        }
      );

      setChatHistory(updatedChats);
      setIsEditing(false);
      setEditingIndex(null);
    }
  };

  const handledata = async () => {
    if (input.trim()) {
      setCurrentChat((prevChat) => [
        ...prevChat,
        { role: "user", content: input },
      ]);
      setInput("");

      const response = await fetch("http://localhost:8000/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          input,
        }),
      });

      const index = currentChat.length + 1;
      setCurrentChat((prevChat) => [
        ...prevChat,
        { role: "assistant", content: "" },
      ]);

      // Creating a reader to process the stream
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let done = false;

      while (!done) {
        const { value, done: readerDone } = await reader.read();
        done = readerDone;
        if (value) {
          const chunk = decoder.decode(value, { stream: !done });

          setCurrentChat((prevChat) =>
            prevChat.map((chat, i) =>
              i === index
                ? { ...chat, content: `${chat.content} ${chunk}` }
                : chat
            )
          );
        }
      }
      console.log("Streaming completed");
    }
  };

  const handleCreateChat = async () => {
    if (currentChat.length === 0) {
      alert("Please enter a prompt or select a chat to edit");
      return;
    }

    const existingChatIndex = chatHistory.findIndex((chat) => {
      const chatMessages = Array.isArray(chat.messages)
        ? chat.messages
        : JSON.parse(chat.messages);
      return (
        chatMessages.length > 0 &&
        chatMessages[0].content === currentChat[0].content
      );
    });

    if (existingChatIndex !== -1) {
      const updatedChat = {
        title: chatHistory[existingChatIndex].title,
        messages: currentChat,
      };

      const response = await fetch(
        `http://localhost:8000/api/chats/${chatHistory[existingChatIndex].id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(updatedChat),
        }
      );

      if (response.ok) {
        const savedChat = await response.json();
        console.log("Chat updated:", savedChat);
        setChatHistory((prev) => {
          const newChatHistory = [...prev];
          newChatHistory[existingChatIndex] = savedChat;
          return newChatHistory;
        });
        setCurrentChat([]);
      } else {
        alert("Failed to update chat");
      }
    } else {
      // Create new chat
      const newChat = { title: "New Chat", messages: currentChat };

      const response = await fetch("http://localhost:8000/api/chats", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newChat),
      });

      if (response.ok) {
        const savedChat = await response.json();
        console.log("Chat created:", savedChat);
        setChatHistory((prev) => [...prev, savedChat]); // Add the new chat to history
        setCurrentChat([]); // Clear current chat
      } else {
        alert("Failed to save chat");
      }
    }
  };

  useEffect(() => {
    const fetchChats = async () => {
      try {
        const response = await fetch("http://localhost:8000/api/chats");
        const data = await response.json();
        setChatHistory(data);
      } catch (error) {
        console.error("Error fetching chats:", error);
      }
    };

    fetchChats();
  }, []);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [currentChat]);

  return (
    <div className="h-screen w-screen flex bg-white">
      <div className="w-1/5 h-screen bg-[#202123] text-white p-4">
        <div className="h-12 font-semibold">
          <button
            className="w-full h-full border rounded"
            onClick={handleCreateChat}
          >
            + New Chat
          </button>
        </div>
        <div className="h-3/4 overflow-scroll hide-scroll-bar mb-2">
          {chatHistory.map((item, index) => (
            <div
              key={index}
              onClick={() => {
                const messages = Array.isArray(item.messages)
                  ? item.messages
                  : JSON.parse(item.messages);
                setCurrentChat(messages);
              }}
              className="py-3 rounded text-center mt-5 font-semibold flex items-center hover:bg-slate-500 px-8 cursor-pointer"
            >
              <span className="material-symbols-outlined mr-3">chat</span>
              {isEditing && editingIndex === index ? (
                <input
                  type="text"
                  value={chatTitle}
                  onChange={(e) => setChatTitle(e.target.value)}
                  onKeyDown={handleTitleChange}
                  className="text-white bg-transparent border-b border-white outline-none"
                  autoFocus
                />
              ) : (
                <span onClick={() => handleTitleEdit(index)}>{item.title}</span>
              )}
            </div>
          ))}
        </div>
        <div className="h-[20%]  overflow-scroll  hide-scroll-bar border-t ">
          <div className="py-3 rounded text-center mt-5  font-semibold flex items-center hover:bg-slate-500 px-8 cursor-pointer  ">
            <span className="material-symbols-outlined mr-3">settings</span>
            Settings
          </div>
          <div className="py-3 rounded text-center mt-5  flex items-center  font-semibold  hover:bg-slate-500 px-8 cursor-pointer ">
            <span className="material-symbols-outlined mr-3">
              manage_accounts
            </span>
            Account
          </div>
        </div>
      </div>
      <div className="w-4/5">
        {Array.isArray(currentChat) && currentChat.length > 0 ? (
          <div className="h-4/5 overflow-scroll hide-scroll-bar pt-6">
            {currentChat.map((item, index) => (
              <div
                key={index}
                className={`w-3/5 border-slate-600 flex items-center mx-auto p-6 text-black ${
                  item.role === "assistant" ? "bg-slate-200 rounded" : ""
                }`}
              >
                <span className="material-symbols-outlined mr-6 p-2 bg-slate-500 rounded-full">
                  {item.role === "user" ? "person" : "smart_toy"}
                </span>
                <div className="markdown">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {item.content}
                  </ReactMarkdown>
                </div>
              </div>
            ))}
            <div ref={chatContainerRef} className="h-1" />
          </div>
        ) : (
          <div className="h-4/5 border flex flex-col justify-center items-center text-black">
            <div className="text-4xl font-bold">Chat Bot</div>
            <div className="flex flex-wrap justify-around max-w-[900px]">
              {samplePrompts.map((item, index) => (
                <div
                  key={index}
                  className="text-lg font-light p-4 border border-black rounded min-w-[400px] mt-4 hover:bg-slate-300 cursor-pointer"
                  onClick={() => setInput(item)}
                >
                  {item}
                </div>
              ))}
            </div>
          </div>
        )}
        <div className="h-1/5">
          <div className="flex flex-col items-center justify-center h-full w-full">
            <div className="w-3/4 flex justify-center relative">
              <input
                type="text"
                onChange={(e) => setInput(e.target.value)}
                className="w-full rounded text-black p-4 pr-16 bg-gray-300"
                placeholder="Type your message..."
                value={input}
              />
              <span
                className="material-symbols-outlined absolute right-4 top-4 cursor-pointer"
                onClick={() => (input.trim() ? handledata() : undefined)}
              >
                send
              </span>
            </div>
            <small className="text-black mt-2">AI can generate anything!</small>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Chat;
