"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const path = require("path");
const ec2 = require("aws-cdk-lib/aws-ec2");
const s3_assets = require("aws-cdk-lib/aws-s3-assets");
const cdk = require("aws-cdk-lib");
const ecs = require("aws-cdk-lib/aws-ecs");
const app = new cdk.App();
const stack = new cdk.Stack(app, 'aws-ecs-integ');
const vpc = new ec2.Vpc(stack, 'Vpc', { maxAzs: 2 });
const cluster = new ecs.Cluster(stack, 'EcsCluster', { vpc });
cluster.addCapacity('DefaultAutoScalingGroup', {
    instanceType: new ec2.InstanceType('t2.micro'),
});
const taskDefinition = new ecs.Ec2TaskDefinition(stack, 'TaskDef', {
    networkMode: ecs.NetworkMode.AWS_VPC,
});
const asset = new s3_assets.Asset(stack, 'SampleAsset', {
    path: path.join(__dirname, 'firelens.conf'),
});
// firelens log router with custom s3 configuration file
taskDefinition.addFirelensLogRouter('log_router', {
    image: ecs.obtainDefaultFluentBitECRImage(taskDefinition, undefined, '2.1.0'),
    firelensConfig: {
        type: ecs.FirelensLogRouterType.FLUENTBIT,
        options: {
            enableECSLogMetadata: false,
            configFileValue: `${asset.bucket.bucketArn}/${asset.s3ObjectKey}`,
            configFileType: ecs.FirelensConfigFileType.S3,
        },
    },
    logging: new ecs.AwsLogDriver({ streamPrefix: 'firelens' }),
    memoryReservationMiB: 50,
});
// new container with firelens log driver
const container = taskDefinition.addContainer('nginx', {
    image: ecs.ContainerImage.fromRegistry('nginx'),
    memoryLimitMiB: 256,
    logging: ecs.LogDrivers.firelens({
        options: {
            Name: 'cloudwatch',
            region: stack.region,
            log_group_name: 'ecs-integ-test',
            auto_create_group: 'true',
            log_stream_prefix: 'nginx',
        },
    }),
});
container.addPortMappings({
    containerPort: 80,
    protocol: ecs.Protocol.TCP,
});
// Create a security group that allows tcp @ port 80
const securityGroup = new ec2.SecurityGroup(stack, 'websvc-sg', { vpc });
securityGroup.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(80));
new ecs.Ec2Service(stack, 'Service', {
    cluster,
    taskDefinition,
    securityGroup,
});
app.synth();
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW50ZWcuZmlyZWxlbnMtczMtY29uZmlnLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiaW50ZWcuZmlyZWxlbnMtczMtY29uZmlnLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQUEsNkJBQTZCO0FBQzdCLDJDQUEyQztBQUMzQyx1REFBdUQ7QUFDdkQsbUNBQW1DO0FBQ25DLDJDQUEyQztBQUUzQyxNQUFNLEdBQUcsR0FBRyxJQUFJLEdBQUcsQ0FBQyxHQUFHLEVBQUUsQ0FBQztBQUMxQixNQUFNLEtBQUssR0FBRyxJQUFJLEdBQUcsQ0FBQyxLQUFLLENBQUMsR0FBRyxFQUFFLGVBQWUsQ0FBQyxDQUFDO0FBQ2xELE1BQU0sR0FBRyxHQUFHLElBQUksR0FBRyxDQUFDLEdBQUcsQ0FBQyxLQUFLLEVBQUUsS0FBSyxFQUFFLEVBQUUsTUFBTSxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUM7QUFDckQsTUFBTSxPQUFPLEdBQUcsSUFBSSxHQUFHLENBQUMsT0FBTyxDQUFDLEtBQUssRUFBRSxZQUFZLEVBQUUsRUFBRSxHQUFHLEVBQUUsQ0FBQyxDQUFDO0FBQzlELE9BQU8sQ0FBQyxXQUFXLENBQUMseUJBQXlCLEVBQUU7SUFDN0MsWUFBWSxFQUFFLElBQUksR0FBRyxDQUFDLFlBQVksQ0FBQyxVQUFVLENBQUM7Q0FDL0MsQ0FBQyxDQUFDO0FBRUgsTUFBTSxjQUFjLEdBQUcsSUFBSSxHQUFHLENBQUMsaUJBQWlCLENBQUMsS0FBSyxFQUFFLFNBQVMsRUFBRTtJQUNqRSxXQUFXLEVBQUUsR0FBRyxDQUFDLFdBQVcsQ0FBQyxPQUFPO0NBQ3JDLENBQUMsQ0FBQztBQUVILE1BQU0sS0FBSyxHQUFHLElBQUksU0FBUyxDQUFDLEtBQUssQ0FBQyxLQUFLLEVBQUUsYUFBYSxFQUFFO0lBQ3RELElBQUksRUFBRSxJQUFJLENBQUMsSUFBSSxDQUFDLFNBQVMsRUFBRSxlQUFlLENBQUM7Q0FDNUMsQ0FBQyxDQUFDO0FBRUgsd0RBQXdEO0FBQ3hELGNBQWMsQ0FBQyxvQkFBb0IsQ0FBQyxZQUFZLEVBQUU7SUFDaEQsS0FBSyxFQUFFLEdBQUcsQ0FBQyw4QkFBOEIsQ0FBQyxjQUFjLEVBQUUsU0FBUyxFQUFFLE9BQU8sQ0FBQztJQUM3RSxjQUFjLEVBQUU7UUFDZCxJQUFJLEVBQUUsR0FBRyxDQUFDLHFCQUFxQixDQUFDLFNBQVM7UUFDekMsT0FBTyxFQUFFO1lBQ1Asb0JBQW9CLEVBQUUsS0FBSztZQUMzQixlQUFlLEVBQUUsR0FBRyxLQUFLLENBQUMsTUFBTSxDQUFDLFNBQVMsSUFBSSxLQUFLLENBQUMsV0FBVyxFQUFFO1lBQ2pFLGNBQWMsRUFBRSxHQUFHLENBQUMsc0JBQXNCLENBQUMsRUFBRTtTQUM5QztLQUNGO0lBQ0QsT0FBTyxFQUFFLElBQUksR0FBRyxDQUFDLFlBQVksQ0FBQyxFQUFFLFlBQVksRUFBRSxVQUFVLEVBQUUsQ0FBQztJQUMzRCxvQkFBb0IsRUFBRSxFQUFFO0NBQ3pCLENBQUMsQ0FBQztBQUVILHlDQUF5QztBQUN6QyxNQUFNLFNBQVMsR0FBRyxjQUFjLENBQUMsWUFBWSxDQUFDLE9BQU8sRUFBRTtJQUNyRCxLQUFLLEVBQUUsR0FBRyxDQUFDLGNBQWMsQ0FBQyxZQUFZLENBQUMsT0FBTyxDQUFDO0lBQy9DLGNBQWMsRUFBRSxHQUFHO0lBQ25CLE9BQU8sRUFBRSxHQUFHLENBQUMsVUFBVSxDQUFDLFFBQVEsQ0FBQztRQUMvQixPQUFPLEVBQUU7WUFDUCxJQUFJLEVBQUUsWUFBWTtZQUNsQixNQUFNLEVBQUUsS0FBSyxDQUFDLE1BQU07WUFDcEIsY0FBYyxFQUFFLGdCQUFnQjtZQUNoQyxpQkFBaUIsRUFBRSxNQUFNO1lBQ3pCLGlCQUFpQixFQUFFLE9BQU87U0FDM0I7S0FDRixDQUFDO0NBQ0gsQ0FBQyxDQUFDO0FBRUgsU0FBUyxDQUFDLGVBQWUsQ0FBQztJQUN4QixhQUFhLEVBQUUsRUFBRTtJQUNqQixRQUFRLEVBQUUsR0FBRyxDQUFDLFFBQVEsQ0FBQyxHQUFHO0NBQzNCLENBQUMsQ0FBQztBQUVILG9EQUFvRDtBQUNwRCxNQUFNLGFBQWEsR0FBRyxJQUFJLEdBQUcsQ0FBQyxhQUFhLENBQUMsS0FBSyxFQUFFLFdBQVcsRUFBRSxFQUFFLEdBQUcsRUFBRSxDQUFDLENBQUM7QUFDekUsYUFBYSxDQUFDLGNBQWMsQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLE9BQU8sRUFBRSxFQUFFLEdBQUcsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7QUFDbkUsSUFBSSxHQUFHLENBQUMsVUFBVSxDQUFDLEtBQUssRUFBRSxTQUFTLEVBQUU7SUFDbkMsT0FBTztJQUNQLGNBQWM7SUFDZCxhQUFhO0NBQ2QsQ0FBQyxDQUFDO0FBRUgsR0FBRyxDQUFDLEtBQUssRUFBRSxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0ICogYXMgcGF0aCBmcm9tICdwYXRoJztcbmltcG9ydCAqIGFzIGVjMiBmcm9tICdhd3MtY2RrLWxpYi9hd3MtZWMyJztcbmltcG9ydCAqIGFzIHMzX2Fzc2V0cyBmcm9tICdhd3MtY2RrLWxpYi9hd3MtczMtYXNzZXRzJztcbmltcG9ydCAqIGFzIGNkayBmcm9tICdhd3MtY2RrLWxpYic7XG5pbXBvcnQgKiBhcyBlY3MgZnJvbSAnYXdzLWNkay1saWIvYXdzLWVjcyc7XG5cbmNvbnN0IGFwcCA9IG5ldyBjZGsuQXBwKCk7XG5jb25zdCBzdGFjayA9IG5ldyBjZGsuU3RhY2soYXBwLCAnYXdzLWVjcy1pbnRlZycpO1xuY29uc3QgdnBjID0gbmV3IGVjMi5WcGMoc3RhY2ssICdWcGMnLCB7IG1heEF6czogMiB9KTtcbmNvbnN0IGNsdXN0ZXIgPSBuZXcgZWNzLkNsdXN0ZXIoc3RhY2ssICdFY3NDbHVzdGVyJywgeyB2cGMgfSk7XG5jbHVzdGVyLmFkZENhcGFjaXR5KCdEZWZhdWx0QXV0b1NjYWxpbmdHcm91cCcsIHtcbiAgaW5zdGFuY2VUeXBlOiBuZXcgZWMyLkluc3RhbmNlVHlwZSgndDIubWljcm8nKSxcbn0pO1xuXG5jb25zdCB0YXNrRGVmaW5pdGlvbiA9IG5ldyBlY3MuRWMyVGFza0RlZmluaXRpb24oc3RhY2ssICdUYXNrRGVmJywge1xuICBuZXR3b3JrTW9kZTogZWNzLk5ldHdvcmtNb2RlLkFXU19WUEMsXG59KTtcblxuY29uc3QgYXNzZXQgPSBuZXcgczNfYXNzZXRzLkFzc2V0KHN0YWNrLCAnU2FtcGxlQXNzZXQnLCB7XG4gIHBhdGg6IHBhdGguam9pbihfX2Rpcm5hbWUsICdmaXJlbGVucy5jb25mJyksXG59KTtcblxuLy8gZmlyZWxlbnMgbG9nIHJvdXRlciB3aXRoIGN1c3RvbSBzMyBjb25maWd1cmF0aW9uIGZpbGVcbnRhc2tEZWZpbml0aW9uLmFkZEZpcmVsZW5zTG9nUm91dGVyKCdsb2dfcm91dGVyJywge1xuICBpbWFnZTogZWNzLm9idGFpbkRlZmF1bHRGbHVlbnRCaXRFQ1JJbWFnZSh0YXNrRGVmaW5pdGlvbiwgdW5kZWZpbmVkLCAnMi4xLjAnKSxcbiAgZmlyZWxlbnNDb25maWc6IHtcbiAgICB0eXBlOiBlY3MuRmlyZWxlbnNMb2dSb3V0ZXJUeXBlLkZMVUVOVEJJVCxcbiAgICBvcHRpb25zOiB7XG4gICAgICBlbmFibGVFQ1NMb2dNZXRhZGF0YTogZmFsc2UsXG4gICAgICBjb25maWdGaWxlVmFsdWU6IGAke2Fzc2V0LmJ1Y2tldC5idWNrZXRBcm59LyR7YXNzZXQuczNPYmplY3RLZXl9YCxcbiAgICAgIGNvbmZpZ0ZpbGVUeXBlOiBlY3MuRmlyZWxlbnNDb25maWdGaWxlVHlwZS5TMyxcbiAgICB9LFxuICB9LFxuICBsb2dnaW5nOiBuZXcgZWNzLkF3c0xvZ0RyaXZlcih7IHN0cmVhbVByZWZpeDogJ2ZpcmVsZW5zJyB9KSxcbiAgbWVtb3J5UmVzZXJ2YXRpb25NaUI6IDUwLFxufSk7XG5cbi8vIG5ldyBjb250YWluZXIgd2l0aCBmaXJlbGVucyBsb2cgZHJpdmVyXG5jb25zdCBjb250YWluZXIgPSB0YXNrRGVmaW5pdGlvbi5hZGRDb250YWluZXIoJ25naW54Jywge1xuICBpbWFnZTogZWNzLkNvbnRhaW5lckltYWdlLmZyb21SZWdpc3RyeSgnbmdpbngnKSxcbiAgbWVtb3J5TGltaXRNaUI6IDI1NixcbiAgbG9nZ2luZzogZWNzLkxvZ0RyaXZlcnMuZmlyZWxlbnMoe1xuICAgIG9wdGlvbnM6IHtcbiAgICAgIE5hbWU6ICdjbG91ZHdhdGNoJyxcbiAgICAgIHJlZ2lvbjogc3RhY2sucmVnaW9uLFxuICAgICAgbG9nX2dyb3VwX25hbWU6ICdlY3MtaW50ZWctdGVzdCcsXG4gICAgICBhdXRvX2NyZWF0ZV9ncm91cDogJ3RydWUnLFxuICAgICAgbG9nX3N0cmVhbV9wcmVmaXg6ICduZ2lueCcsXG4gICAgfSxcbiAgfSksXG59KTtcblxuY29udGFpbmVyLmFkZFBvcnRNYXBwaW5ncyh7XG4gIGNvbnRhaW5lclBvcnQ6IDgwLFxuICBwcm90b2NvbDogZWNzLlByb3RvY29sLlRDUCxcbn0pO1xuXG4vLyBDcmVhdGUgYSBzZWN1cml0eSBncm91cCB0aGF0IGFsbG93cyB0Y3AgQCBwb3J0IDgwXG5jb25zdCBzZWN1cml0eUdyb3VwID0gbmV3IGVjMi5TZWN1cml0eUdyb3VwKHN0YWNrLCAnd2Vic3ZjLXNnJywgeyB2cGMgfSk7XG5zZWN1cml0eUdyb3VwLmFkZEluZ3Jlc3NSdWxlKGVjMi5QZWVyLmFueUlwdjQoKSwgZWMyLlBvcnQudGNwKDgwKSk7XG5uZXcgZWNzLkVjMlNlcnZpY2Uoc3RhY2ssICdTZXJ2aWNlJywge1xuICBjbHVzdGVyLFxuICB0YXNrRGVmaW5pdGlvbixcbiAgc2VjdXJpdHlHcm91cCxcbn0pO1xuXG5hcHAuc3ludGgoKTtcbiJdfQ==