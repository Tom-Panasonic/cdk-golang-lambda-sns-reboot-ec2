package main

import (
	"context"
	"fmt"
	"log"
	"os"

	"github.com/aws/aws-lambda-go/lambda"
	"github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/service/ec2"
	"github.com/aws/aws-sdk-go-v2/service/sns"
)

type Response struct {
	Status string `json:"status"`
}

func handler(ctx context.Context) (Response, error) {
	// Load AWS configuration
	cfg, err := config.LoadDefaultConfig(ctx)
	if err != nil {
		log.Printf("unable to load SDK config, %v", err)
		return Response{Status: "ERROR"}, err
	}

	// Get instance ID and SNS topic ARN from environment variables
	instanceID := os.Getenv("INSTANCE_ID")
	snsTopicArn := os.Getenv("SNS_TOPIC_ARN")

	if instanceID == "" || snsTopicArn == "" {
		err := fmt.Errorf("INSTANCE_ID or SNS_TOPIC_ARN environment variable is not set")
		log.Printf("%v", err)
		return Response{Status: "ERROR"}, err
	}

	// Create EC2 client
	ec2Client := ec2.NewFromConfig(cfg)

	// Reboot EC2 instance
	_, err = ec2Client.RebootInstances(ctx, &ec2.RebootInstancesInput{
		InstanceIds: []string{instanceID},
	})
	if err != nil {
		log.Printf("failed to reboot instance %s, %v", instanceID, err)
		return Response{Status: "ERROR"}, err
	}

	log.Printf("Successfully initiated reboot for instance %s", instanceID)

	// Create SNS client
	snsClient := sns.NewFromConfig(cfg)

	// Send notification via SNS
	message := fmt.Sprintf("EC2インスタンス %s を自動で再起動しました。", instanceID)
	_, err = snsClient.Publish(ctx, &sns.PublishInput{
		TopicArn: &snsTopicArn,
		Message:  &message,
	})
	if err != nil {
		log.Printf("failed to publish SNS message, %v", err)
		return Response{Status: "ERROR"}, err
	}

	log.Printf("Successfully published SNS notification")

	return Response{Status: "OK"}, nil
}

func main() {
	lambda.Start(handler)
}
