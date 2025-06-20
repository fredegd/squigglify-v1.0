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
      className={`border-2 border-dashed rounded-lg p-12 flex flex-col items-center justify-center h-96 transition-colors ${isUploading
        ? "border-blue-500 bg-blue-500/20"
        : isDragging
          ? "border-primary bg-primary/40"
          : "border-gray-700 hover:border-gray-500 max-h-64 w-full max-w-lg"
        }`}
      onDragOver={!isUploading ? handleDragOver : undefined}
      onDragLeave={!isUploading ? handleDragLeave : undefined}
      onDrop={!isUploading ? handleDrop : undefined}
    >
      <input type="file" ref={fileInputRef} onChange={handleFileInput} accept="image/*" className="hidden" />

      <div className="text-center">
        <div className="mb-4 bg-gray-800 p-4 rounded-full inline-block">
          {isDragging ? (
            <Upload className="h-10 w-10 text-primary" />
          ) : (
            <ImageIcon className="h-10 w-10 text-gray-300" />
          )}
        </div>
        <h3 className="text-xl font-medium mb-2">
          {isUploading ? "Processing image..." : isDragging ? "Drop your image here" : "Upload an image"}
        </h3>
        <p className="text-gray-300 mb-4">
          {isUploading
            ? "Compressing and saving to local storage..."
            : "Upload an image and convert it into a vector wave paths"
          }
        </p>

        <Button
          onClick={handleButtonClick}
          variant="outline"
          className="border-gray-500 text-black hover:bg-gray-500 hover:text-white"
          disabled={isUploading}
        >
          {isUploading ? "Processing..." : "Select Image"}
        </Button>
      </div>
    </div>
  )
}
