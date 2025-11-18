import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as iam from "aws-cdk-lib/aws-iam";
import * as path from "path";
import * as fs from "fs";

export class CdkGolangLambdaSnsRebootEc2Stack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Load configuration from os_version.json
    const configPath = path.join(__dirname, "../os_version.json");
    const config = JSON.parse(fs.readFileSync(configPath, "utf8"));
    const instanceId = config.instanceId;
    const snsTopicArn = config.snsTopicArn;

    // Create IAM role for Lambda
    const lambdaRole = new iam.Role(this, "LambdaExecutionRole", {
      assumedBy: new iam.ServicePrincipal("lambda.amazonaws.com"),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          "service-role/AWSLambdaBasicExecutionRole"
        ),
      ],
    });

    // Add EC2 reboot permissions
    lambdaRole.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ["ec2:RebootInstances"],
        resources: ["*"],
      })
    );

    // Add SNS publish permissions
    lambdaRole.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ["sns:Publish"],
        resources: [snsTopicArn],
      })
    );

    // Create Lambda function
    const rebootLambda = new lambda.Function(this, "RebootEc2LambdaFunction", {
      runtime: lambda.Runtime.PROVIDED_AL2,
      handler: "bootstrap",
      code: lambda.Code.fromAsset(path.join(__dirname, "../lambda"), {
        bundling: {
          image: lambda.Runtime.PROVIDED_AL2.bundlingImage,
          command: [
            "bash",
            "-c",
            "GOOS=linux GOARCH=amd64 go build -o /asset-output/bootstrap main.go",
          ],
          user: "root",
        },
      }),
      role: lambdaRole,
      environment: {
        INSTANCE_ID: instanceId,
        SNS_TOPIC_ARN: snsTopicArn,
      },
      timeout: cdk.Duration.seconds(30),
      description:
        "Lambda function to reboot EC2 instance and notify via SNS with Golang And CDK",
    });

    // Output the Lambda function name
    new cdk.CfnOutput(this, "LambdaFunctionName", {
      value: rebootLambda.functionName,
      description: "Lambda function name for EC2 reboot",
    });

    // Output the Lambda function ARN
    new cdk.CfnOutput(this, "LambdaFunctionArn", {
      value: rebootLambda.functionArn,
      description: "Lambda function ARN",
    });
  }
}
