from ultralytics import YOLO

def main():
    # Load a lightweight pre-trained YOLOv8 model (yolov8n.pt)
    model = YOLO('yolov8n.pt')
    
    print("Starting AgriVision AI Model Training...")
    
    # Train the model using your custom dataset configuration
    results = model.train(
        data=r'ml_pipeline/data/data.yaml',  # Path to your yaml file
        epochs=30,                          # Number of training epochs
        imgsz=640,                          # Image size
        batch=16,                           # Batch size
        name='agrivision_crop_model',       # Output training run name
        val=False                           # <--- validation skip
    )

    print("Training finished successfully! Weights saved in runs/detect/agrivision_crop_model/weights/best.pt")

if __name__ == '__main__':
    main()