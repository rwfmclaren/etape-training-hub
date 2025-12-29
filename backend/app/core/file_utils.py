import os
import uuid
from pathlib import Path
from fastapi import UploadFile, HTTPException


# Configuration
UPLOAD_DIR = "uploads/training_documents"
MAX_UPLOAD_SIZE = 10 * 1024 * 1024  # 10MB
ALLOWED_EXTENSIONS = {".pdf", ".txt", ".doc", ".docx"}


def save_upload_file(upload_file: UploadFile, subdir: str) -> str:
    """
    Save uploaded file and return relative path.

    Args:
        upload_file: The FastAPI UploadFile object
        subdir: Subdirectory within UPLOAD_DIR (e.g., "plan_123")

    Returns:
        str: Relative path to the saved file

    Raises:
        HTTPException: If file type not allowed or file too large
    """
    # Validate extension
    file_ext = Path(upload_file.filename).suffix.lower()
    if file_ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"File type {file_ext} not allowed. Allowed types: {', '.join(ALLOWED_EXTENSIONS)}"
        )

    # Create directory if not exists
    upload_path = Path(UPLOAD_DIR) / subdir
    upload_path.mkdir(parents=True, exist_ok=True)

    # Generate unique filename
    unique_filename = f"{uuid.uuid4()}{file_ext}"
    file_path = upload_path / unique_filename

    # Read and validate file size
    file_content = upload_file.file.read()
    if len(file_content) > MAX_UPLOAD_SIZE:
        raise HTTPException(
            status_code=400,
            detail=f"File size exceeds maximum allowed size of {MAX_UPLOAD_SIZE / (1024*1024)}MB"
        )

    # Save file
    with open(file_path, "wb") as f:
        f.write(file_content)

    # Return relative path
    return str(file_path)


def delete_file(file_path: str) -> None:
    """Delete a file from the filesystem"""
    try:
        if os.path.exists(file_path):
            os.remove(file_path)
    except Exception as e:
        # Log error but don't raise - file deletion failures shouldn't break the API
        print(f"Error deleting file {file_path}: {e}")
