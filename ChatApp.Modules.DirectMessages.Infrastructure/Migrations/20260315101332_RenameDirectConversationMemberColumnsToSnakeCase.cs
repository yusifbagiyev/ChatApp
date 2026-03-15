using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ChatApp.Modules.DirectMessages.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class RenameDirectConversationMemberColumnsToSnakeCase : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_direct_conversation_members_direct_conversations_Conversati~",
                table: "direct_conversation_members");

            migrationBuilder.RenameColumn(
                name: "Id",
                table: "direct_conversation_members",
                newName: "id");

            migrationBuilder.RenameColumn(
                name: "UserId",
                table: "direct_conversation_members",
                newName: "user_id");

            migrationBuilder.RenameColumn(
                name: "UpdatedAtUtc",
                table: "direct_conversation_members",
                newName: "updated_at_utc");

            migrationBuilder.RenameColumn(
                name: "LastReadLaterMessageId",
                table: "direct_conversation_members",
                newName: "last_read_later_message_id");

            migrationBuilder.RenameColumn(
                name: "IsPinned",
                table: "direct_conversation_members",
                newName: "is_pinned");

            migrationBuilder.RenameColumn(
                name: "IsMuted",
                table: "direct_conversation_members",
                newName: "is_muted");

            migrationBuilder.RenameColumn(
                name: "IsMarkedReadLater",
                table: "direct_conversation_members",
                newName: "is_marked_read_later");

            migrationBuilder.RenameColumn(
                name: "IsHidden",
                table: "direct_conversation_members",
                newName: "is_hidden");

            migrationBuilder.RenameColumn(
                name: "IsActive",
                table: "direct_conversation_members",
                newName: "is_active");

            migrationBuilder.RenameColumn(
                name: "CreatedAtUtc",
                table: "direct_conversation_members",
                newName: "created_at_utc");

            migrationBuilder.RenameColumn(
                name: "ConversationId",
                table: "direct_conversation_members",
                newName: "conversation_id");

            migrationBuilder.RenameIndex(
                name: "IX_direct_conversation_members_UserId_IsActive",
                table: "direct_conversation_members",
                newName: "IX_direct_conversation_members_user_id_is_active");

            migrationBuilder.RenameIndex(
                name: "IX_direct_conversation_members_UserId",
                table: "direct_conversation_members",
                newName: "IX_direct_conversation_members_user_id");

            migrationBuilder.RenameIndex(
                name: "IX_direct_conversation_members_ConversationId_UserId",
                table: "direct_conversation_members",
                newName: "IX_direct_conversation_members_conversation_id_user_id");

            migrationBuilder.AlterColumn<bool>(
                name: "is_hidden",
                table: "direct_conversation_members",
                type: "boolean",
                nullable: false,
                defaultValue: false,
                oldClrType: typeof(bool),
                oldType: "boolean");

            migrationBuilder.AddForeignKey(
                name: "FK_direct_conversation_members_direct_conversations_conversati~",
                table: "direct_conversation_members",
                column: "conversation_id",
                principalTable: "direct_conversations",
                principalColumn: "id",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_direct_conversation_members_direct_conversations_conversati~",
                table: "direct_conversation_members");

            migrationBuilder.RenameColumn(
                name: "id",
                table: "direct_conversation_members",
                newName: "Id");

            migrationBuilder.RenameColumn(
                name: "user_id",
                table: "direct_conversation_members",
                newName: "UserId");

            migrationBuilder.RenameColumn(
                name: "updated_at_utc",
                table: "direct_conversation_members",
                newName: "UpdatedAtUtc");

            migrationBuilder.RenameColumn(
                name: "last_read_later_message_id",
                table: "direct_conversation_members",
                newName: "LastReadLaterMessageId");

            migrationBuilder.RenameColumn(
                name: "is_pinned",
                table: "direct_conversation_members",
                newName: "IsPinned");

            migrationBuilder.RenameColumn(
                name: "is_muted",
                table: "direct_conversation_members",
                newName: "IsMuted");

            migrationBuilder.RenameColumn(
                name: "is_marked_read_later",
                table: "direct_conversation_members",
                newName: "IsMarkedReadLater");

            migrationBuilder.RenameColumn(
                name: "is_hidden",
                table: "direct_conversation_members",
                newName: "IsHidden");

            migrationBuilder.RenameColumn(
                name: "is_active",
                table: "direct_conversation_members",
                newName: "IsActive");

            migrationBuilder.RenameColumn(
                name: "created_at_utc",
                table: "direct_conversation_members",
                newName: "CreatedAtUtc");

            migrationBuilder.RenameColumn(
                name: "conversation_id",
                table: "direct_conversation_members",
                newName: "ConversationId");

            migrationBuilder.RenameIndex(
                name: "IX_direct_conversation_members_user_id_is_active",
                table: "direct_conversation_members",
                newName: "IX_direct_conversation_members_UserId_IsActive");

            migrationBuilder.RenameIndex(
                name: "IX_direct_conversation_members_user_id",
                table: "direct_conversation_members",
                newName: "IX_direct_conversation_members_UserId");

            migrationBuilder.RenameIndex(
                name: "IX_direct_conversation_members_conversation_id_user_id",
                table: "direct_conversation_members",
                newName: "IX_direct_conversation_members_ConversationId_UserId");

            migrationBuilder.AlterColumn<bool>(
                name: "IsHidden",
                table: "direct_conversation_members",
                type: "boolean",
                nullable: false,
                oldClrType: typeof(bool),
                oldType: "boolean",
                oldDefaultValue: false);

            migrationBuilder.AddForeignKey(
                name: "FK_direct_conversation_members_direct_conversations_Conversati~",
                table: "direct_conversation_members",
                column: "ConversationId",
                principalTable: "direct_conversations",
                principalColumn: "id",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
