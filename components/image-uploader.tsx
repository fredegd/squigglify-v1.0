"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Upload, ImageIcon } from "lucide-react"
import { Button } from "@/components/ui/button"

interface ImageUploaderProps {
  onImageUpload: (imageDataUrl: string, fileName: string) => Promise<void> | void
}

export default function ImageUploader({ onImageUpload }: ImageUploaderProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0])
    }
  }

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0])
    }
  }

  const handleFile = async (file: File) => {
    // Check if file is an image
    if (!file.type.match("image.*")) {
      alert("Please select an image file")
      return
    }

    // Check file size (warn if > 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      const proceed = confirm(
        `This file is ${(file.size / 1024 / 1024).toFixed(2)}MB. ` +
        `Large files will be automatically compressed to fit in local storage. Continue?`
      );
      if (!proceed) return;
    }

    setIsUploading(true);

    try {
      const reader = new FileReader()
      reader.onload = async (e) => {
        if (e.target && typeof e.target.result === "string") {
          try {
            await onImageUpload(e.target.result, file.name);
          } catch (error) {
            console.error('Error uploading image:', error);
            alert('Failed to upload image. Please try again.');
          } finally {
            setIsUploading(false);
          }
        }
      }
      reader.onerror = () => {
        setIsUploading(false);
        alert('Failed to read file. Please try again.');
      };
      reader.readAsDataURL(file)
    } catch (error) {
      setIsUploading(false);
      console.error('Error handling file:', error);
      alert('Failed to process file. Please try again.');
    }
  }

  const handleButtonClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click()
    }
  }

  return (
    <div
      className={`relative group border-2 border-dashed rounded-xl p-12 flex flex-col items-center justify-center h-96 transition-all duration-300 ${isUploading
        ? "border-blue-500 bg-blue-500/10"
        : isDragging
          ? "border-purple-500 bg-purple-500/10"
          : "border-gray-700 bg-gray-900/50 hover:border-purple-500 hover:shadow-lg hover:shadow-purple-500/20"
        }`}
      onDragOver={!isUploading ? handleDragOver : undefined}
      onDragLeave={!isUploading ? handleDragLeave : undefined}
      onDrop={!isUploading ? handleDrop : undefined}
    >
      <input type="file" ref={fileInputRef} onChange={handleFileInput} accept="image/*" className="hidden" />

      <div className="text-center z-10">
        <div className={`mb-6 p-4 rounded-2xl inline-block transition-colors duration-300 ${isDragging ? "bg-purple-500/20" : "bg-gray-800 group-hover:bg-gray-800/80"
          }`}>
          {isDragging ? (
            <Upload className="h-10 w-10 text-purple-400 animate-bounce" />
          ) : (
            <ImageIcon className="h-10 w-10 text-gray-400 group-hover:text-purple-400 transition-colors duration-300" />
          )}
        </div>
        <h3 className="text-xl font-bold text-white mb-3">
          {isUploading ? "Processing image..." : isDragging ? "Drop your image here" : "Upload an image"}
        </h3>
        <p className="text-gray-400 mb-8 max-w-sm mx-auto leading-relaxed">
          {isUploading
            ? "Compressing and saving to local storage..."
            : "Upload an image and convert it into a vector wave"
          }
        </p>

        <Button
          onClick={handleButtonClick}
          size="lg"
          className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white border-0 shadow-lg shadow-purple-500/25 transition-all duration-300 hover:scale-105"
          disabled={isUploading}
        >
          {isUploading ? "Processing..." : "Select Image"}
        </Button>
      </div>
    </div>
  )
}
